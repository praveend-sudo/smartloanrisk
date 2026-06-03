import { useState } from "react";
import { BANDS, fmtUSD, type ScoreBand } from "@/lib/credit-data";
import { cn } from "@/lib/utils";

interface Props {
  totalLoanAmount: number;
  totalOutstanding: number;
  totalCardLimit: number;
  totalCardBalance: number;
  atRiskExposure: number;
  bandCounts: Record<ScoreBand, number>;
  bandExposure: Record<ScoreBand, number>;
  customerCount: number;
}

export function PortfolioKPIs(p: Props) {
  const totalExposure = p.totalOutstanding + p.totalCardBalance;
  const riskPct = totalExposure > 0 ? (p.atRiskExposure / totalExposure) * 100 : 0;

  const kpis = [
    { label: "Total Loan Book", value: fmtUSD(p.totalLoanAmount), sub: `${p.customerCount} customers` },
    { label: "Outstanding Balance", value: fmtUSD(p.totalOutstanding), sub: "Active loans" },
    { label: "Card Credit Issued", value: fmtUSD(p.totalCardLimit), sub: `Utilization ${((p.totalCardBalance / p.totalCardLimit) * 100).toFixed(1)}%` },
    {
      label: "At-Risk Exposure",
      value: fmtUSD(p.atRiskExposure),
      sub: `${riskPct.toFixed(1)}% of portfolio`,
      accent: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {kpis.map((k) => (
        <div
          key={k.label}
          className="rounded-xl border bg-card p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k.label}</div>
          <div
            className={`mt-2 text-3xl font-semibold tabular-nums ${k.accent ? "text-[var(--band-risk)]" : "text-foreground"}`}
          >
            {k.value}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{k.sub}</div>
        </div>
      ))}

      <DistributionSection
        customerCount={p.customerCount}
        bandCounts={p.bandCounts}
        bandExposure={p.bandExposure}
      />
    </div>
  );
}

function DistributionSection({
  customerCount,
  bandCounts,
  bandExposure,
}: {
  customerCount: number;
  bandCounts: Record<ScoreBand, number>;
  bandExposure: Record<ScoreBand, number>;
}) {
  const [period, setPeriod] = useState<"current" | "6m" | "12m">("current");

  const Tab = ({
    id,
    label,
  }: {
    id: "current" | "6m" | "12m";
    label: string;
  }) => (
    <button
      onClick={() => setPeriod(id)}
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-medium transition",
        period === id
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="md:col-span-2 xl:col-span-4 rounded-xl border bg-card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Portfolio Distribution by Risk Band
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">Smart Credit Score 0–999 · live segmentation</div>
        </div>
        <div className="flex items-center gap-2">
          <Tab id="current" label="Now" />
          <Tab id="6m" label="6 Months" />
          <Tab id="12m" label="12 Months" />
          <span className="ml-1 text-xs text-muted-foreground">{customerCount} customers</span>
        </div>
      </div>

      <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
        {BANDS.map((b) => {
          const count = bandCounts[b.id];
          const pct = (count / customerCount) * 100;
          return (
            <div
              key={b.id}
              style={{ width: `${pct}%`, backgroundColor: `var(--${b.color})` }}
              title={`${b.label}: ${count} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {BANDS.map((b) => {
          const count = bandCounts[b.id];
          const pct = (count / customerCount) * 100;
          const exposure = bandExposure[b.id];
          return (
            <div key={b.id} className="rounded-lg border bg-background/40 p-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: `var(--${b.color})` }}
                />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: `var(--${b.color})` }}>
                  {b.label}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Score {b.range}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-semibold tabular-nums">{count}</span>
                <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Exposure {fmtUSD(exposure)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
