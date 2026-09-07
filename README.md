# Udyam Disha

**Rural business feasibility and loan readiness advisory platform**

Udyam Disha helps first-time rural entrepreneurs check whether their business idea will work in their village — before they apply for a government-backed micro-enterprise loan.

## What it does

1. **Voice or text input** — entrepreneur enters their state, district, village, business category, and available capital, in any supported regional language.
2. **Multilingual normalization** — a Groq LLM (`gpt-oss-120b`) translates and standardizes the input, with RapidFuzz matching it against known locations and categories.
3. **Market intelligence** — computes market density, business saturation index, true disposable wealth, infrastructure readiness score, and economy type ratio from village-level census data.
4. **Live competitor check** — queries the Google Places API for real-time nearby competitor density in the entrepreneur's specific business category.
5. **Financial planning** — matches the entrepreneur to the right government credit scheme (Micro Finance / Term Loan) and generates a full EMI repayment schedule.
6. **AI advisory report** — generates a SWOT analysis, pricing suggestion, and recommended government schemes (e.g. PMFME, PMEGP, MUDRA), delivered in the user's chosen language.

## Tech stack

- **Backend:** FastAPI, Pydantic, Pandas
- **Frontend:** React 19, TypeScript, Vite, TanStack Router, Tailwind CSS
- **AI/LLM:** Groq (`gpt-oss-120b`) for translation and report generation
- **Matching:** RapidFuzz for fuzzy location/category resolution
- **External APIs:** Google Places API (live competitor data), Google Geocoding API

## Supported languages

English, Hindi, Assamese

## Disclaimer

This tool provides an indicative feasibility assessment only, to support a government-backed loan application. It is not a substitute for professional financial or legal advice.