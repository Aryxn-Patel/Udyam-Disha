import os
import json
from groq import Groq
from dataclasses import dataclass
from typing import List, Optional

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
MODEL_NAME = "openai/gpt-oss-120b"


@dataclass
class SWOT:
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]


@dataclass
class GovernmentScheme:
    scheme_name: str
    subsidy_benefit: str
    eligibility_fit: str


@dataclass
class BusinessReport:
    swot: SWOT
    threats_summary: str
    pricing_suggestion: str
    pricing_value_estimate: str
    recommended_schemes: List[GovernmentScheme]
    language: str


class LLMReportError(Exception):
    pass


LANGUAGE_ALIASES = {
    "hindi": "Hindi", "hi": "Hindi", "हिंदी": "Hindi", "हिन्दी": "Hindi",
    "english": "English", "en": "English",
    "assamese": "Assamese", "as": "Assamese", "অসমীয়া": "Assamese",
    "bengali": "Bengali", "bn": "Bengali",
    "marathi": "Marathi", "mr": "Marathi",
    "tamil": "Tamil", "ta": "Tamil",
    "telugu": "Telugu", "te": "Telugu",
    "gujarati": "Gujarati", "gu": "Gujarati",
    "kannada": "Kannada", "kn": "Kannada",
    "malayalam": "Malayalam", "ml": "Malayalam",
    "punjabi": "Punjabi", "pa": "Punjabi",
    "odia": "Odia", "or": "Odia",
}


def normalize_language(raw_language: str) -> str:
    key = (raw_language or "").strip().lower()
    normalized = LANGUAGE_ALIASES.get(key, raw_language.strip() if raw_language else "English")
    print(f"[llm_report_generator] language requested='{raw_language}' -> normalized='{normalized}'")
    return normalized


SCHEME_NAME_TRANSLATIONS = {
    "hindi": {
        "PMEGP": "प्रधानमंत्री रोजगार सृजन कार्यक्रम (PMEGP)",
        "MUDRA": "प्रधानमंत्री मुद्रा योजना",
        "CLSS": "क्रेडिट लिंक्ड सब्सिडी योजना (CLSS)",
        "STAND-UP INDIA": "स्टैंड-अप इंडिया योजना",
        "PMFME": "प्रधानमंत्री सूक्ष्म खाद्य प्रसंस्करण उद्यम योजना (PMFME)",
        "NABARD": "नाबार्ड ऋण योजना",
        "NATIONAL LIVESTOCK MISSION": "राष्ट्रीय पशुधन मिशन",
    },
}


def normalize_scheme_name(name: str, language: str) -> str:
    lang_map = SCHEME_NAME_TRANSLATIONS.get(language.strip().lower())
    if not lang_map or not name:
        return name

    for key, translated in lang_map.items():
        if key.lower() in name.lower():
            return translated
    return name


def build_prompt(location: str, business_category: str, available_capital: float,
                 market_density: float, business_saturation_index: float,
                 true_disposable_wealth: float, infrastructure_readiness_score: float,
                 economy_type_ratio: float, language: str,
                 live_competitor_count: Optional[int] = None) -> str:

    live_competitor_line = (
        f"- Live Competitor Count (within 5km, Google Maps data): {live_competitor_count}"
        if live_competitor_count is not None
        else "- Live Competitor Count: unavailable (rely on Business Saturation Index instead)"
    )

    if language.lower() == "english":
        language_rules = """
CRITICAL LANGUAGE RULE:
Everything MUST be written in English. Translate any non-English inputs into English.
Do NOT use Hindi or any regional language for any field.
        """
        final_reminder = "FINAL REMINDER (most important): Every single string value in your JSON output must be in English. No Hindi or other languages allowed."
    else:
        language_rules = f"""
CRITICAL LANGUAGE RULE FOR SCHEME NAMES:
"scheme_name" must be written FULLY in {language} script — including the scheme's
official meaning, not just the English acronym. Spell out what the acronym stands for
in {language}, and you may keep the English short-code in brackets after it, but the
short-code alone is NOT acceptable as the whole field.
Example for Hindi:
  WRONG: "scheme_name": "PMEGP"
  WRONG: "scheme_name": "Prime Minister's Employment Generation Programme (PMEGP)"
  RIGHT: "scheme_name": "प्रधानमंत्री रोजगार सृजन कार्यक्रम (PMEGP)"
Apply the same rule to every other field — "subsidy_benefit" and "eligibility_fit" must
also be natively written in {language}, not transliterated and not left in English.
        """
        final_reminder = f"FINAL REMINDER (most important): Every single string value in your JSON output — every SWOT point, every summary, every scheme field — must be written in {language}. If {language} is Hindi, use Devanagari script throughout, not English and not Romanized Hindi. Do not slip into English anywhere in the response."

    return f"""
You are an expert rural business consultant in India. Generate a business feasibility
analysis for a first-time entrepreneur based on the following real data. Do not invent
numbers beyond what is given. Keep language extremely simple, suitable for someone with
limited formal education. Respond ONLY in {language}.

LOCATION: {location}
PROPOSED BUSINESS: {business_category}
ENTREPRENEUR'S AVAILABLE CAPITAL: Rs. {available_capital}

CALCULATED MARKET METRICS:
- Market Density (people per sq km): {market_density}
- Business Saturation Index (firms per 1,000 people): {business_saturation_index}
- True Disposable Wealth Index (Rs.): {true_disposable_wealth}
- Infrastructure Readiness Score (0 to 5): {infrastructure_readiness_score}
- Economy Type Ratio (services employment / total employment): {economy_type_ratio}
{live_competitor_line}

HOW TO INTERPRET EACH METRIC:
1. Market Density: High density means walk-in foot traffic. Low means marketing needed.
2. Business Saturation Index: High means proven but competitive. Low means untapped or poor infrastructure.
3. True Disposable Wealth Index: Use this to justify your pricing suggestion.
4. Infrastructure Readiness Score: 4-5 means easy setup. 0-1 means real capital challenges (power/roads). Highlight low scores in Weaknesses/Threats.
5. Economy Type Ratio: > 0.5 favors consumer/services. < 0.5 favors industrial/agri.
6. Live Competitor Count: If available, this is real-time ground data and takes priority over the Business Saturation Index for competitor-related points. If unavailable, use the Business Saturation Index instead and do not mention live data.

GOVERNMENT SCHEME MATCHING:
Using your knowledge of Indian central and state government policies, subsidies, and
credit schemes (such as PMFME, PMEGP, MUDRA, Stand-Up India, National Livestock Mission,
NABARD schemes, and relevant state-specific grants), recommend 2-3 schemes that are the
best fit for this entrepreneur, based on their business type, location, and available
capital. Only suggest schemes that are plausibly real and relevant — do not invent scheme
names.

{language_rules}

Return ONLY valid JSON, no markdown formatting, no code fences, in exactly this shape:
{{
  "strengths": ["point 1", "point 2"],
  "weaknesses": ["point 1", "point 2"],
  "opportunities": ["point 1", "point 2"],
  "threats": ["point 1", "point 2"],
  "threats_summary": "one short paragraph on the biggest local risk",
  "pricing_suggestion": "one short paragraph suggesting a pricing approach",
  "pricing_value_estimate": "a specific suggested price range, e.g. Rs. 30-40 per unit",
  "recommended_schemes": [
    {{
      "scheme_name": "name of a relevant central or state government scheme, fully in {language} per the rule above",
      "subsidy_benefit": "one short line on the subsidy/loan/credit benefit it offers",
      "eligibility_fit": "one short line on why it fits this entrepreneur's business, location, and capital"
    }}
  ]
}}

Each list should have 2-3 short items, each under 15 words.
"recommended_schemes" must contain 2-3 entries.

{final_reminder}
"""


def build_system_message(language: str) -> str:
    if language.lower() == "english":
        return (
            "You are an expert business-advisory assistant. You must respond ONLY in English. "
            "Translate any non-English input context into English before generating the JSON output. "
            "This applies to every field in your JSON output, including scheme names."
        )
    return (
        f"You are a multilingual business-advisory assistant. You must respond ONLY in "
        f"{language}, in native script (e.g. Devanagari for Hindi, Assamese script for "
        f"Assamese) — never in English, never transliterated/Romanized, regardless of what "
        f"language the input data or instructions are written in. This applies to every "
        f"field in your JSON output, including proper nouns and scheme names. Violating "
        f"this is a critical failure."
    )


def parse_llm_response(raw_text: str) -> dict:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise LLMReportError(f"Failed to parse LLM output as JSON: {e}\nRaw output: {raw_text}")


NATIVE_SCRIPT_RANGES = {
    "hindi": (0x0900, 0x097F),
    "assamese": (0x0980, 0x09FF),
}


def response_matches_language(data: dict, language: str) -> bool:
    lang_key = language.strip().lower()
    script_range = NATIVE_SCRIPT_RANGES.get(lang_key)
    if not script_range:
        return True

    sample_parts = []
    sample_parts.extend(data.get("strengths", []))
    sample_parts.extend(data.get("weaknesses", []))
    sample_parts.append(data.get("threats_summary", ""))
    sample_text = " ".join(sample_parts)

    if not sample_text.strip():
        return True

    low, high = script_range
    native_chars = sum(1 for ch in sample_text if low <= ord(ch) <= high)
    letter_chars = sum(1 for ch in sample_text if ch.isalpha())
    if letter_chars == 0:
        return True
    return (native_chars / letter_chars) > 0.3


def generate_business_report(location: str, business_category: str, available_capital: float,
                              market_density: float, business_saturation_index: float,
                              true_disposable_wealth: float, infrastructure_readiness_score: float,
                              economy_type_ratio: float, language: str = "English",
                              live_competitor_count: Optional[int] = None) -> BusinessReport:

    if not GROQ_API_KEY:
        raise LLMReportError("GROQ_API_KEY environment variable is not set.")

    language = normalize_language(language)

    prompt = build_prompt(
        location=location, business_category=business_category, available_capital=available_capital,
        market_density=market_density, business_saturation_index=business_saturation_index,
        true_disposable_wealth=true_disposable_wealth, infrastructure_readiness_score=infrastructure_readiness_score,
        economy_type_ratio=economy_type_ratio, language=language,
        live_competitor_count=live_competitor_count,
    )

    client = Groq(api_key=GROQ_API_KEY)

    def call_groq(extra_nudge: str = "") -> dict:
        system_content = build_system_message(language)
        user_content = prompt + extra_nudge
        try:
            resp = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": user_content},
                ],
                model=MODEL_NAME,
                temperature=0,
            )
        except Exception as e:
            raise LLMReportError(f"Groq API call failed: {e}")
        return parse_llm_response(resp.choices[0].message.content)

    data = call_groq()

    if not response_matches_language(data, language):
        print(f"[llm_report_generator] response failed language check for '{language}', retrying with stronger nudge")
        
        if language.lower() == "english":
            retry_nudge = (
                "\n\nYOUR PREVIOUS ATTEMPT WAS REJECTED because it contained non-English text. "
                "This time, write EVERY field strictly in English."
            )
        else:
            retry_nudge = (
                f"\n\nYOUR PREVIOUS ATTEMPT WAS REJECTED because it was written in English "
                f"instead of {language}. This time, write EVERY field in {language} native "
                f"script. Do not use English at all."
            )
            
        retried_data = call_groq(retry_nudge)
        if response_matches_language(retried_data, language):
            data = retried_data
        else:
            print(f"[llm_report_generator] retry still failed language check for '{language}', using it anyway")
            data = retried_data

    swot = SWOT(
        strengths=data.get("strengths", []),
        weaknesses=data.get("weaknesses", []),
        opportunities=data.get("opportunities", []),
        threats=data.get("threats", []),
    )

    recommended_schemes = [
        GovernmentScheme(
            scheme_name=normalize_scheme_name(s.get("scheme_name", ""), language),
            subsidy_benefit=s.get("subsidy_benefit", ""),
            eligibility_fit=s.get("eligibility_fit", ""),
        )
        for s in data.get("recommended_schemes", [])
    ]

    return BusinessReport(
        swot=swot,
        threats_summary=data.get("threats_summary", ""),
        pricing_suggestion=data.get("pricing_suggestion", ""),
        pricing_value_estimate=data.get("pricing_value_estimate", ""),
        recommended_schemes=recommended_schemes,
        language=language,
    )


if __name__ == "__main__":
    for test_value in ["Hindi", "hindi", "hi", "HINDI", "", None, "English"]:
        print(test_value, "->", normalize_language(test_value))