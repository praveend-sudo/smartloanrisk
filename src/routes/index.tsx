import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import logosAsset from "@/assets/logos.png.asset.json";
import { CUSTOMERS, portfolioStats, type Customer } from "@/lib/credit-data";
import { PortfolioKPIs, type Period } from "@/components/risk/PortfolioKPIs";
import { Watchlist } from "@/components/risk/Watchlist";
import { CustomerDetail } from "@/components/risk/CustomerDetail";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Credit Risk Dashboard · IronOne × Fidem Financial" },
      {
        name: "description",
        content:
          "Probabilistic 6 & 12-month credit risk forecasting for retail loan and credit-card portfolios.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const statsCurrent = useMemo(() => portfolioStats(CUSTOMERS, "scoreCurrent"), []);
  const stats6m = useMemo(() => portfolioStats(CUSTOMERS, "score6m"), []);
  const stats12m = useMemo(() => portfolioStats(CUSTOMERS, "score12m"), []);
  const statsMap = { current: statsCurrent, "6m": stats6m, "12m": stats12m };

  const [period, setPeriod] = useState<Period>("current");
  const [selected, setSelected] = useState<Customer | null>(null);

  const stats = statsMap[period];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-3">
          <div className="flex items-center gap-4">
            <img src={logosAsset.url} alt="IronOne × Fidem Financial" className="h-10 w-auto" />
            <div className="hidden h-8 w-px bg-border md:block" />
            <div className="hidden md:block">
              <div className="text-sm font-semibold leading-tight">Smart Credit Risk Console</div>
              <div className="text-xs text-muted-foreground">
                Probabilistic forecasting · Score 0–999 · USD
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden md:inline">Portfolio refreshed · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--band-loyal-soft)] px-3 py-1 text-[var(--band-loyal)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--band-loyal)]" />
              Live · demo data
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portfolio Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Total exposure, risk segmentation and predictive watchlist across all loan and credit-card products.
          </p>
        </div>

        <PortfolioKPIs {...stats} customerCount={CUSTOMERS.length} period={period} onPeriodChange={setPeriod} />

        <Watchlist onSelect={setSelected} selectedId={selected?.id} />
      </main>

      {selected && <CustomerDetail customer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
