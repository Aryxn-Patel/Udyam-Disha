const BASE_URL = "https://kuchbhi-ubn6.onrender.com";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
    this.name = "ApiError";
  }
}

async function parseErrorDetail(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body.detail === "string" && body.detail.trim().length > 0) {
      return body.detail;
    }
    return `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

export interface StatesResponse {
  states: string[];
}

export interface DistrictsResponse {
  state_name: string;
  districts: string[];
}

export interface BlocksResponse {
  state_name: string;
  district_name: string;
  blocks: string[];
}

export interface VillagesResponse {
  state_name: string;
  district_name: string;
  subdistrict_name: string | null;
  villages: string[];
}

export interface EMIInstallment {
  quarter: number;
  opening_balance: number;
  emi: number;
  interest_component: number;
  principal_component: number;
  closing_balance: number;
}

export interface FinancialPlan {
  project_cost: number;
  loan_amount: number;
  scheme_name: string;
  interest_rate_annual: number;
  tenure_years: number;
  moratorium_months: number;
  quarterly_emi: number;
  total_interest_payable: number;
  total_repayment: number;
  emi_schedule: EMIInstallment[];
}

export interface MarketMetrics {
  state_name: string;
  district_name: string;
  village_name: string;
  subdistrict_name: string;
  total_population: number;
  land_area_sq_km: number;
  market_density: number;
  business_saturation_index: number;
  true_disposable_wealth: number;
  infrastructure_readiness_score: number;
  economy_type_ratio: number;
  live_competitor_count: number | null;
  competitor_breakdown: string | null;
  radius_km: number | null;
}

export interface SWOT {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface GovernmentScheme {
  scheme_name: string;
  subsidy_benefit: string;
  eligibility_fit: string;
}

export interface BusinessReport {
  swot: SWOT;
  threats_summary: string;
  pricing_suggestion: string;
  pricing_value_estimate: string;
  recommended_schemes: GovernmentScheme[];
}

export interface GenerateReportResponse {
  location: string;
  business_category: string;
  language: string;
  translated_business_category: string;
  market_metrics: MarketMetrics;
  financial_plan: FinancialPlan;
  business_report: BusinessReport | null;
  business_report_error: string | null;
}

export interface GenerateReportRequest {
  state_name: string;
  district_name: string;
  subdistrict_name?: string;
  village_name: string;
  business_category: string;
  available_capital: number;
  language: string;
}

export type ReportRequest = GenerateReportRequest;
export type ReportResponse = GenerateReportResponse;

const DEFAULT_TIMEOUT_MS = 90_000;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getStates(): Promise<StatesResponse> {
  const response = await fetchWithTimeout(`${BASE_URL}/locations/states`);
  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorDetail(response));
  }
  return response.json();
}

export async function getDistricts(stateName: string): Promise<DistrictsResponse> {
  const url = `${BASE_URL}/locations/districts?state_name=${encodeURIComponent(stateName)}`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorDetail(response));
  }
  return response.json();
}

export async function getBlocks(stateName: string, districtName: string): Promise<BlocksResponse> {
  const url = `${BASE_URL}/locations/blocks?state_name=${encodeURIComponent(stateName)}&district_name=${encodeURIComponent(districtName)}`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorDetail(response));
  }
  return response.json();
}

export async function getVillages(
  stateName: string,
  districtName: string,
  subdistrictName?: string
): Promise<VillagesResponse> {
  const params = new URLSearchParams({
    state_name: stateName,
    district_name: districtName,
  });
  if (subdistrictName) {
    params.set("subdistrict_name", subdistrictName);
  }
  const url = `${BASE_URL}/locations/villages?${params.toString()}`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorDetail(response));
  }
  return response.json();
}

export async function generateReport(request: GenerateReportRequest): Promise<GenerateReportResponse> {
  const response = await fetchWithTimeout(`${BASE_URL}/generate-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorDetail(response));
  }

  return response.json();
}