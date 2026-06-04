import { BANDS, fmtUSD, type ScoreBand } from "@/lib/credit-data";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export type Period = "current" | "6m";

interface Props {
  totalLoanAmount: number;
  totalOutstanding: number;
  atRiskExposure: number;
  bandCounts: Record<ScoreBand, number>;
  bandExposure: Record<ScoreBand, number>;
  customerCount: number;
  period: Period;
  onPeriodChange: (p: Period) => void;
}

export function PortfolioKPIs(p: Props) {
  const riskPct = p.totalOutstanding > 0 ? (p.atRiskExposure / p.totalOutstanding) * 100 : 0;
  const utilPct = p.totalLoanAmount > 0 ? (p.totalOutstanding / p.totalLoanAmount) * 100 : 0;

  const totalCustomers = Object.values(p.bandCounts).reduce((a, b) => a + b, 0);
  const avgLoan = totalCustomers > 0 ? p.totalLoanAmount / totalCustomers : 0;

  const kpis = [
    { label: "Total Loan Book", value: fmtUSD(p.totalLoanAmount), sub: `${p.customerCount} customers` },
    { label: "Outstanding Balance", value: fmtUSD(p.totalOutstanding), sub: `Utilization ${utilPct.toFixed(1)}%` },
    { label: "Avg Loan / Customer", value: fmtUSD(avgLoan), sub: "Across 3 products" },
    {
      label: "At-Risk Exposure",
      value: fmtUSD(p.atRiskExposure),
      sub: `${riskPct.toFixed(1)}% of portfolio`,
      accent: true,
    },
  ];

  const Tab = ({ id, label }: { id: Period; label: string }) => (
    <button
      onClick={() => p.onPeriodChange(id)}
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-medium transition",
        p.period === id
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
      )}
    >
      {label}
    </button>
  );

  return (
    <TooltipProvider delayDuration={150}>
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
              <span className="ml-1 text-xs text-muted-foreground">{p.customerCount} customers</span>
            </div>
          </div>

          <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
            {BANDS.map((b) => {
              const count = p.bandCounts[b.id];
              const pct = (count / p.customerCount) * 100;
              return (
                <Tooltip key={b.id}>
                  <TooltipTrigger asChild>
                    <div
                      style={{ width: `${pct}%`, backgroundColor: `var(--${b.color})` }}
                      className="cursor-help"
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-card text-foreground border shadow-lg">
                    <BandTip band={b} count={count} pct={pct} exposure={p.bandExposure[b.id]} />
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {BANDS.map((b) => {
              const count = p.bandCounts[b.id];
              const pct = (count / p.customerCount) * 100;
              const exposure = p.bandExposure[b.id];
              return (
                <Tooltip key={b.id}>
                  <TooltipTrigger asChild>
                    <div className="rounded-lg border bg-background/40 p-3 cursor-help transition hover:bg-background/70">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: `var(--${b.color})` }}
                          />
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: `var(--${b.color})` }}>
                            {b.label}
                          </span>
                        </div>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">Score {b.range}</div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-xl font-semibold tabular-nums">{count}</span>
                        <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">Exposure {fmtUSD(exposure)}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-card text-foreground border shadow-lg">
                    <BandTip band={b} count={count} pct={pct} exposure={exposure} />
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function BandTip({
  band,
  count,
  pct,
  exposure,
}: {
  band: (typeof BANDS)[number];
  count: number;
  pct: number;
  exposure: number;
}) {
  return (
    <div className="space-y-2 p-1">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: `var(--${band.color})` }} />
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: `var(--${band.color})` }}>
          {band.label}
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground">
        Score range <span className="text-foreground font-medium">{band.range}</span> · {count} customers ({pct.toFixed(1)}%) · {fmtUSD(exposure)} exposure
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Recommended actions</div>
        <ul className="space-y-0.5 text-xs">
          {band.actions.map((a) => (
            <li key={a} className="flex gap-1.5">
              <span style={{ color: `var(--${band.color})` }}>•</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
