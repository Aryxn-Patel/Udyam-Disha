from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional

from financial_engine import build_financial_plan, FinancialEngineError, EMIInstallment
from market_engine import (
    get_market_metrics,
    translate_user_input,
    get_available_states,
    get_available_districts,
    get_available_blocks,
    get_available_villages,
    MarketDataError,
    TranslationError,
    MarketMetrics,
)
from market import get_live_competitor_density, LiveMarketError
from llm_report_generator import generate_business_report, LLMReportError

app = FastAPI(title="SIH26091 Combined API", version="0.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateReportRequest(BaseModel):
    state_name: str
    district_name: str
    subdistrict_name: Optional[str] = None
    village_name: str
    business_category: str
    available_capital: float = Field(..., gt=0)
    language: str = "English"


class EMIInstallmentResponse(BaseModel):
    quarter: int
    opening_balance: float
    emi: float
    interest_component: float
    principal_component: float
    closing_balance: float

    @classmethod
    def from_dataclass(cls, i: EMIInstallment):
        return cls(**i.__dict__)


class FinancialPlanResponse(BaseModel):
    project_cost: float
    loan_amount: float
    scheme_name: str
    interest_rate_annual: float
    tenure_years: int
    moratorium_months: int
    quarterly_emi: float
    total_interest_payable: float
    total_repayment: float
    emi_schedule: List[EMIInstallmentResponse]


class MarketMetricsResponse(BaseModel):
    state_name: str
    district_name: str
    village_name: str
    subdistrict_name: str
    total_population: float
    land_area_sq_km: float
    market_density: float
    business_saturation_index: float
    true_disposable_wealth: float
    infrastructure_readiness_score: float
    economy_type_ratio: float
    live_competitor_count: Optional[int] = None
    competitor_breakdown: Optional[str] = None
    radius_km: Optional[float] = None

    @classmethod
    def from_dataclass(cls, m: MarketMetrics, live_competitor_count: Optional[int] = None,
                        competitor_breakdown: Optional[str] = None, radius_km: Optional[float] = None):
        return cls(**m.__dict__, live_competitor_count=live_competitor_count,
                    competitor_breakdown=competitor_breakdown, radius_km=radius_km)


class SWOTResponse(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]


class GovernmentSchemeResponse(BaseModel):
    scheme_name: str
    subsidy_benefit: str
    eligibility_fit: str


class BusinessReportResponse(BaseModel):
    swot: SWOTResponse
    threats_summary: str
    pricing_suggestion: str
    pricing_value_estimate: str
    recommended_schemes: List[GovernmentSchemeResponse]


class GenerateReportResponse(BaseModel):
    location: str
    business_category: str
    language: str
    translated_business_category: str
    market_metrics: MarketMetricsResponse
    financial_plan: FinancialPlanResponse
    business_report: Optional[BusinessReportResponse]
    business_report_error: Optional[str]


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/locations/states")
def list_states():
    return {"states": get_available_states()}


@app.get("/locations/districts")
def list_districts(state_name: str):
    districts = get_available_districts(state_name)
    if not districts:
        raise HTTPException(status_code=404, detail=f"No districts found for state '{state_name}'.")
    return {"state_name": state_name, "districts": districts}


@app.get("/locations/blocks")
def list_blocks(state_name: str, district_name: str):
    blocks = get_available_blocks(state_name, district_name)
    if not blocks:
        raise HTTPException(
            status_code=404,
            detail=f"No blocks found for district '{district_name}', state '{state_name}'."
        )
    return {"state_name": state_name, "district_name": district_name, "blocks": blocks}


@app.get("/locations/villages")
def list_villages(state_name: str, district_name: str, subdistrict_name: Optional[str] = None):
    villages = get_available_villages(state_name, district_name, subdistrict_name)
    if not villages:
        raise HTTPException(
            status_code=404,
            detail=f"No villages found for district '{district_name}', state '{state_name}'."
        )
    return {
        "state_name": state_name,
        "district_name": district_name,
        "subdistrict_name": subdistrict_name,
        "villages": villages,
    }


@app.post("/generate-report", response_model=GenerateReportResponse)
def generate_report(request: GenerateReportRequest):

    try:
        translated = translate_user_input(
            state_name=request.state_name,
            district_name=request.district_name,
            village_name=request.village_name,
            business_category=request.business_category,
        )
    except TranslationError as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {e}")

    try:
        market_metrics = get_market_metrics(
            state_name=translated.state_name,
            district_name=translated.district_name,
            village_name=translated.village_name,
            subdistrict_name=request.subdistrict_name,
        )
    except MarketDataError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Live competitor check via Google Places — best-effort, never blocks the request
    live_competitor_count: Optional[int] = None
    competitor_breakdown: Optional[str] = None
    live_radius_km: Optional[float] = None
    try:
        live_data = get_live_competitor_density(
            village_name=market_metrics.village_name,
            district_name=market_metrics.district_name,
            state_name=market_metrics.state_name,
            # Use the original canonical category (from the frontend dropdown:
            # "Dairy", "Retail", etc.) rather than translated.business_category.
            # The LLM translation step can return phrasing like "Dairy Products"
            # or "Milk Products" that doesn't exactly match SECTOR_MAPPING's keys,
            # silently falling back to the generic "store" type — which is how
            # unrelated results like electronics stores were showing up for Dairy.
            business_type=request.business_category,
            # radius_km intentionally omitted — get_live_competitor_density
            # resolves a category-appropriate radius on its own (see market.py).
        )
        live_competitor_count = live_data.competitor_count
        competitor_breakdown = live_data.competitor_breakdown
        live_radius_km = live_data.radius_km
    except LiveMarketError as e:
        print(f"LIVE COMPETITOR ERROR: {e}")

    try:
        plan = build_financial_plan(request.available_capital)
    except FinancialEngineError as e:
        raise HTTPException(status_code=400, detail=str(e))

    financial_plan_response = FinancialPlanResponse(
        project_cost=plan.project_cost,
        loan_amount=plan.loan_amount,
        scheme_name=plan.scheme_name,
        interest_rate_annual=plan.interest_rate_annual,
        tenure_years=plan.tenure_years,
        moratorium_months=plan.moratorium_months,
        quarterly_emi=plan.quarterly_emi,
        total_interest_payable=plan.total_interest_payable,
        total_repayment=plan.total_repayment,
        emi_schedule=[EMIInstallmentResponse.from_dataclass(i) for i in plan.emi_schedule],
    )

    market_metrics_response = MarketMetricsResponse.from_dataclass(
        market_metrics, live_competitor_count=live_competitor_count,
        competitor_breakdown=competitor_breakdown, radius_km=live_radius_km,
    )

    business_report_response = None
    business_report_error = None

    try:
        report = generate_business_report(
            location=f"{market_metrics.village_name}, {market_metrics.district_name}, {market_metrics.state_name}",
            business_category=translated.business_category,
            available_capital=request.available_capital,
            market_density=market_metrics.market_density,
            business_saturation_index=market_metrics.business_saturation_index,
            true_disposable_wealth=market_metrics.true_disposable_wealth,
            infrastructure_readiness_score=market_metrics.infrastructure_readiness_score,
            economy_type_ratio=market_metrics.economy_type_ratio,
            language=request.language,
            live_competitor_count=live_competitor_count,
        )
        business_report_response = BusinessReportResponse(
            swot=SWOTResponse(
                strengths=report.swot.strengths,
                weaknesses=report.swot.weaknesses,
                opportunities=report.swot.opportunities,
                threats=report.swot.threats,
            ),
            threats_summary=report.threats_summary,
            pricing_suggestion=report.pricing_suggestion,
            pricing_value_estimate=report.pricing_value_estimate,
            recommended_schemes=[
                GovernmentSchemeResponse(
                    scheme_name=s.scheme_name,
                    subsidy_benefit=s.subsidy_benefit,
                    eligibility_fit=s.eligibility_fit,
                )
                for s in report.recommended_schemes
            ],
        )
    except LLMReportError as e:
        business_report_error = str(e)

    return GenerateReportResponse(
        location=f"{market_metrics.village_name}, {market_metrics.district_name}, {market_metrics.state_name}",
        business_category=request.business_category,
        language=request.language,
        translated_business_category=translated.business_category,
        market_metrics=market_metrics_response,
        financial_plan=financial_plan_response,
        business_report=business_report_response,
        business_report_error=business_report_error,
    )