import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SiteLayout } from "@/components/SiteLayout";
import { useI18n } from "@/lib/i18n";
import { loadReport, formatNum, formatINR, type StoredReport } from "@/lib/report-store";
import type { SWOT } from "@/lib/api";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Feasibility Report — Udyam Disha" },
      {
        name: "description",
        content: "Market snapshot, SWOT analysis, and pricing suggestion for your rural business idea.",
      },
    ],
  }),
  component: ReportPage,
});

function normalizeSwot(raw: unknown): SWOT {
  const empty: SWOT = { strengths: [], weaknesses: [], opportunities: [], threats: [] };
  if (!raw) return empty;

  let parsed: any = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return empty;
    }
  }
  if (typeof parsed !== "object" || parsed === null) return empty;

  const lowerKeyMap: Record<string, unknown> = {};
  for (const key of Object.keys(parsed)) {
    lowerKeyMap[key.toLowerCase()] = parsed[key];
  }

  function toArray(value: unknown): string[] {
    if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
    if (typeof value === "string" && value.trim().length > 0) return [value];
    return [];
  }

  return {
    strengths: toArray(lowerKeyMap["strengths"]),
    weaknesses: toArray(lowerKeyMap["weaknesses"]),
    opportunities: toArray(lowerKeyMap["opportunities"]),
    threats: toArray(lowerKeyMap["threats"]),
  };
}

function InfrastructureBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(5, Math.round(score)));
  return (
    <div className="mb-1 flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded ${i <= clamped ? "bg-ud-ochre" : "bg-ud-gold"}`}
        />
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string | null;
}) {
  return (
    <div className="border border-ud-gold bg-ud-cream p-4">
      <p className="text-sm font-semibold tracking-wide text-ud-ochre uppercase">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ud-brown">{value}</p>
      {description && <p className="mt-1 text-xs text-ud-brown opacity-60">{description}</p>}
    </div>
  );
}

function ReportPage() {
  const { t, tRadius } = useI18n();
  const [data, setData] = useState<StoredReport | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setData(loadReport());
    setReady(true);
  }, []);

  if (!ready) return <SiteLayout>{null}</SiteLayout>;

  if (!data) {
    return (
      <SiteLayout>
        <div className="border border-ud-gold bg-ud-sand p-6">
          <p className="text-base font-semibold text-ud-brown">{t("noData")}</p>
          <Link
            to="/"
            className="mt-3 inline-block rounded-[3px] border border-ud-brown bg-ud-ochre px-4 py-2 font-bold text-ud-cream"
          >
            {t("back")}
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const { response } = data;
  const metrics = response.market_metrics;
  const isReportMissing = response.business_report === null || response.business_report === undefined;
  const swot = isReportMissing ? null : normalizeSwot(response.business_report?.swot);

  const swotBlocks: [string, string[]][] = isReportMissing
    ? []
    : [
        [t("strengths"), swot!.strengths],
        [t("weaknesses"), swot!.weaknesses],
        [t("opportunities"), swot!.opportunities],
        [t("threats"), swot!.threats],
      ];

  return (
    <SiteLayout>
      <div className="border border-ud-gold bg-ud-sand p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ud-brown sm:text-3xl">{t("reportTitle")}</h1>
            <p className="mt-1 text-base text-ud-brown capitalize">
              {response.location} · {response.business_category}
            </p>
          </div>
          <Link
            to="/"
            className="no-print shrink-0 rounded-[3px] border-2 border-ud-brown bg-white px-4 py-2 text-sm font-bold text-ud-brown hover:bg-ud-cream"
          >
            {t("editDetails")}
          </Link>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-ud-brown">{t("marketSnapshot")}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Stat
            label={t("population")}
            value={formatNum(metrics.total_population, 0)}
            description={t("populationDesc")}
          />
          <Stat
            label={t("marketDensity")}
            value={`${formatNum(metrics.market_density)} / sq km`}
            description={t("marketDensityDesc")}
          />
          <Stat
            label={t("saturation")}
            value={formatNum(metrics.business_saturation_index)}
            description={t("saturationDesc")}
          />
          <Stat
            label={t("wealth")}
            value={formatINR(metrics.true_disposable_wealth)}
            description={t("wealthDesc")}
          />
          <div className="border border-ud-gold bg-ud-cream p-4">
            <p className="text-sm font-semibold tracking-wide text-ud-ochre uppercase">
              {t("infra")}
            </p>
            <div className="mt-2">
              <InfrastructureBar score={metrics.infrastructure_readiness_score} />
              <p className="text-sm text-ud-brown">
                {metrics.infrastructure_readiness_score.toFixed(1)} / 5
              </p>
            </div>
            <p className="mt-1 text-xs text-ud-brown opacity-60">{t("infraDesc")}</p>
          </div>
          <Stat
            label={t("economy")}
            value={formatNum(metrics.economy_type_ratio, 3)}
            description={t("economyDesc")}
          />
          {metrics.live_competitor_count !== null && metrics.live_competitor_count !== undefined && (
            <Stat
              label={t("competitorDensity")}
              value={`${metrics.live_competitor_count >= 20 ? "20+" : metrics.live_competitor_count} nearby`}
              description={t("competitorDensityDesc")}
            />
          )}
        </div>
      </section>

      {!isReportMissing && response.business_report!.recommended_schemes.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-bold text-ud-brown">{t("govSchemes")}</h2>
          <p className="mt-1 text-sm text-ud-brown opacity-80">{t("govSchemesSub")}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {response.business_report!.recommended_schemes.map((scheme, i) => (
              <div key={i} className="border-l-4 border-green-600 bg-ud-cream p-4">
                <p className="font-bold text-ud-brown">{scheme.scheme_name}</p>
                <p className="mt-1 text-sm text-ud-brown">{scheme.subsidy_benefit}</p>
                <p className="mt-1 text-xs italic text-ud-brown opacity-70">{scheme.eligibility_fit}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {isReportMissing ? (
        <section className="mt-6 border border-ud-gold bg-ud-cream p-5">
          <p className="text-base text-ud-brown">{t("advisoryUnavailable")}</p>
        </section>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="text-lg font-bold text-ud-brown">{t("swot")}</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {swotBlocks.map(([label, items]) => (
                <div key={label} className="border border-ud-gold">
                  <div className="bg-ud-ochre px-4 py-2 font-bold text-ud-cream">{label}</div>
                  <div className="bg-ud-cream p-4">
                    {items.length > 0 ? (
                      <ul className="list-inside list-disc space-y-1 text-sm text-ud-brown">
                        {items.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm italic text-ud-brown opacity-70">No data available</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-bold text-ud-brown">{t("pricing")}</h2>
            <div className="mt-3 flex items-center justify-between border-l-4 border-ud-ochre bg-ud-cream p-5">
              <div>
                <p className="text-sm text-ud-brown">{response.business_report?.pricing_suggestion}</p>
                <p className="mt-2 text-xs font-bold tracking-wide text-ud-ochre uppercase">
                  {t("valueEstimate")}
                </p>
              </div>
              <div className="ml-6 whitespace-nowrap text-2xl font-bold text-ud-brown">
                {response.business_report?.pricing_value_estimate}
              </div>
            </div>
          </section>
        </>
      )}

      <div className="no-print mt-6">
        <Link
          to="/roadmap"
          className="inline-block rounded-[3px] bg-ud-brown px-6 py-3 font-bold text-ud-cream"
        >
          {t("next")}
        </Link>
      </div>
    </SiteLayout>
  );
}