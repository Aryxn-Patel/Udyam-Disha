import os
import requests
from dataclasses import dataclass
from typing import Optional

GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY")

# Sector mapping to match the broad categories with valid Google Places API (New) types.
# IMPORTANT: only use types from Google's official supported list —
# https://developers.google.com/maps/documentation/places/web-service/place-types
# Invalid types cause a 400 Bad Request on the whole request, not a partial result.
SECTOR_MAPPING = {
    "food processing / agro / rice mills": ["grocery_store", "supermarket"],
    "manufacturing / general msme / retail": ["store", "hardware_store", "clothing_store", "convenience_store"],
    "large industrial / service units": ["store"],
    "handloom, handicrafts & bamboo crafts": ["home_goods_store", "clothing_store", "art_gallery"],
    "technology / it / digital services": ["electronics_store"],
    # fallback for canonical categories used elsewhere in the app
    "dairy": ["grocery_store", "supermarket"],
    "retail": ["store", "convenience_store", "clothing_store"],
    "textiles": ["clothing_store", "home_goods_store"],
    "food processing": ["grocery_store", "supermarket"],
    "general store": ["convenience_store", "store"],
}

DEFAULT_TYPES = ["store", "convenience_store"]

# Category-based search radius (km). Hyperlocal daily-use businesses (dairy,
# general store, food items) only compete with what's genuinely walkable —
# a 5km radius for these pulls in shops the customer will never realistically
# choose between. Broader-catchment categories get a wider radius accordingly.
RADIUS_BY_CATEGORY = {
    "dairy": 1.5,
    "general store": 1.5,
    "food processing / agro / rice mills": 1.5,
    "food processing": 1.5,
    "food items": 1.5,
    "manufacturing / general msme / retail": 2.5,
    "retail": 2.5,
    "handloom, handicrafts & bamboo crafts": 4.0,
    "textiles": 4.0,
    "handicrafts": 4.0,
    "handloom": 4.0,
    "bamboo crafts": 4.0,
    "technology / it / digital services": 5.0,
    "large industrial / service units": 8.0,
}

DEFAULT_RADIUS_KM = 3.0


class LiveMarketError(Exception):
    pass


@dataclass
class LiveCompetitorData:
    latitude: float
    longitude: float
    competitor_count: int
    competitor_breakdown: str  # Frontend par dikhane ke liye nayi field
    radius_km: float
    sector_types_checked: list


def _resolve_sector_types(business_type: str) -> list:
    """
    Resolve a business_type string to Google Places types.

    Tries an exact match first. If that fails (e.g. an LLM-translated
    category like "Dairy Products" instead of the canonical "Dairy"),
    falls back to a substring match against known keys before giving up
    and using the generic DEFAULT_TYPES — which pulls in unrelated results
    (e.g. electronics stores showing up under "Dairy").
    """
    normalized = business_type.lower().strip()

    if normalized in SECTOR_MAPPING:
        return SECTOR_MAPPING[normalized]

    for key, types in SECTOR_MAPPING.items():
        if key in normalized or normalized in key:
            return types

    return DEFAULT_TYPES


def _resolve_radius(business_type: str) -> float:
    """
    Resolve a business_type string to a search radius in km.

    Same pattern as _resolve_sector_types — exact match first, then
    substring match, then a sane default. Kept as a separate resolver
    (rather than folding into SECTOR_MAPPING) because radius and Places
    "types" are independent concerns that can evolve separately.
    """
    normalized = business_type.lower().strip()

    if normalized in RADIUS_BY_CATEGORY:
        return RADIUS_BY_CATEGORY[normalized]

    for key, radius in RADIUS_BY_CATEGORY.items():
        if key in normalized or normalized in key:
            return radius

    return DEFAULT_RADIUS_KM


def _geocode(village_name: str, district_name: str, state_name: str) -> tuple:
    if not GOOGLE_MAPS_API_KEY:
        raise LiveMarketError("GOOGLE_MAPS_API_KEY is not configured.")

    address = f"{village_name}, {district_name}, {state_name}, India"
    url = (
        "https://maps.googleapis.com/maps/api/geocode/json"
        f"?address={requests.utils.quote(address)}&key={GOOGLE_MAPS_API_KEY}"
    )

    try:
        resp = requests.get(url, timeout=10).json()
    except Exception as e:
        raise LiveMarketError(f"Geocoding request failed: {e}")

    if resp.get("status") != "OK" or not resp.get("results"):
        raise LiveMarketError(
            f"Could not geocode '{address}' (status={resp.get('status')})."
        )

    location = resp["results"][0]["geometry"]["location"]
    return location["lat"], location["lng"]


def get_live_competitor_density(
    village_name: str,
    district_name: str,
    state_name: str,
    business_type: str,
    radius_km: Optional[float] = None,
) -> LiveCompetitorData:
    """
    Geocodes the given location and counts nearby businesses matching the
    sector via Google Places (New) searchNearby. Raises LiveMarketError on
    any failure — callers should treat this as best-effort and fall back
    to the static census-derived business_saturation_index if it fails.

    radius_km: agar caller explicitly kuch pass karta hai to wahi use hoga
    (override). Agar None hai (default), to business_type ke hisaab se
    _resolve_radius() se category-appropriate radius nikal liya jaata hai —
    hyperlocal businesses (dairy, general store) ke liye chhota radius,
    aur broader-catchment categories (large industrial units) ke liye bada.
    """
    lat, lng = _geocode(village_name, district_name, state_name)

    target_types = _resolve_sector_types(business_type)
    resolved_radius_km = radius_km if radius_km is not None else _resolve_radius(business_type)

    url = "https://places.googleapis.com/v1/places:searchNearby"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.primaryType",
    }
    payload = {
        "includedTypes": target_types,
        "maxResultCount": 20,
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": resolved_radius_km * 1000,
            }
        },
    }

    try:
        res = requests.post(url, json=payload, headers=headers, timeout=10)
        res.raise_for_status()
        places = res.json().get("places", [])

        # Har category ka alag count nikalne ka logic
        category_counts = {}
        for place in places:
            primary_type = place.get('primaryType', 'Other')
            category_counts[primary_type] = category_counts.get(primary_type, 0) + 1

        def _fmt_count(v: int) -> str:
            # API caps results at maxResultCount, so display as capped "N+"
            return "20+" if v >= 20 else f"{v}+"

        # Format: "10+ Grocery Store, 5+ Convenience Store"
        breakdown_list = [
            f"{_fmt_count(v)} {k.replace('_', ' ').title()}"
            for k, v in category_counts.items()
        ]
        breakdown_str = ", ".join(breakdown_list) if breakdown_list else "No active competitors found"

    except Exception as e:
        raise LiveMarketError(f"Places API call failed: {e}")

    return LiveCompetitorData(
        latitude=lat,
        longitude=lng,
        competitor_count=len(places),
        competitor_breakdown=breakdown_str,
        radius_km=resolved_radius_km,
        sector_types_checked=target_types,
    )