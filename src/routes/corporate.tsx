import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Building2,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Layers,
  ShieldAlert,
  ClipboardCheck,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Download,
} from "lucide-react";
import logosAsset from "@/assets/logos.png.asset.json";
import {
  CORPORATES,
  portfolioSummary,
  facilityTotals,
  ratingToBand,
  bandMeta,
  fmtUSD,
  fmtUSDFull,
  RATING_ORDER,
  type Corporate,
  type CorpProduct,
  type ActionType,
} from "@/lib/corporate-data";
import { CollapsibleSection } from "@/components/risk/CollapsibleSection";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/corporate")({
  head: () => ({
    meta: [
      { title: "Corporate Credit Risk Dashboard · IronOne × Fidem Financial" },
      {
        name: "description",
        content:
          "Corporate loan portfolio monitoring: ratings, covenant tracking, sector concentration, and renewal pipeline.",
      },
    ],
  }),
  component: CorporateDashboard,
});

const ACTION_COLORS: Record<ActionType, string> = {
  "Covenant Review": "bg-[var(--band-risk-soft)] text-[var(--band-risk)]",
  "Rating Watch": "bg-[var(--band-watch-soft)] text-[var(--band-watch)]",
  "Exposure Reduction": "bg-[var(--band-watch-soft)] text-[var(--band-watch)]",
  "Renewal Discussion": "bg-[var(--band-stable-soft)] text-[var(--band-stable)]",
  "Routine Monitoring": "bg-[var(--band-loyal-soft)] text-[var(--band-loyal)]",
};

function CorporateDashboard() {
  const summary = useMemo(() => portfolioSummary(), []);
  const [selected, setSelected] = useState<Corporate | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-3">
          <div className="flex items-center gap-4">
            <img src={logosAsset.url} alt="IronOne × Fidem Financial" className="h-10 w-auto" />
            <div className="hidden h-8 w-px bg-border md:block" />
            <div className="hidden md:block">
              <div className="text-sm font-semibold leading-tight">Corporate Credit Console</div>
              <div className="text-xs text-muted-foreground">
                Wholesale lending · Ratings AAA–CCC · USD
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-1 text-xs">
            <Link
              to="/"
              className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition hover:bg-muted"
            >
              Retail
            </Link>
            <Link
              to="/corporate"
              className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground"
            >
              Corporate
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Corporate Portfolio Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary.count} corporate borrowers · {fmtUSD(summary.sanctioned)} sanctioned · live exposure, covenant
            and rating-migration monitoring.
          </p>
        </div>

        <CollapsibleSection
          title="Portfolio KPIs"
          description="Sanctioned, outstanding, at-risk exposure and watchlist concentration"
          icon={Building2}
        >
          <KPIGrid summary={summary} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Product-Wise Snapshot"
          description="Term Loan · Working Capital · Syndicated Loan"
          icon={Layers}
        >
          <ProductSnapshot summary={summary} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Sector Concentration & Single-Borrower Limits"
          description="Identify concentration breaches against bank limit framework"
          icon={ShieldAlert}
        >
          <ConcentrationPanel summary={summary} onSelectCustomer={setSelected} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Covenant Breach Alerts"
          description="Borrowers with DSCR, leverage or liquidity covenants flagged"
          icon={AlertTriangle}
        >
          <CovenantAlerts onSelectCustomer={setSelected} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Rating Migration Watch"
          description="6-month forecasted downgrades and upgrades"
          icon={TrendingDown}
        >
          <RatingMigration onSelectCustomer={setSelected} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Action Planner & Renewal Pipeline"
          description="Sortable, exportable RM action list"
          icon={ClipboardCheck}
        >
          <ActionPlanner onSelectCustomer={setSelected} />
        </CollapsibleSection>
      </main>

      {selected && <CorpDetail corp={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ============= KPI Grid ============= */
function KPIGrid({ summary }: { summary: ReturnType<typeof portfolioSummary> }) {
  const utilization = (summary.outstanding / summary.sanctioned) * 100;
  const atRiskPct = (summary.atRisk / summary.outstanding) * 100;
  const watchlistCount = CORPORATES.filter((c) => {
    const b = ratingToBand(c.rating);
    return b === "watch" || b === "risk";
  }).length;

  const cards = [
    { label: "Total Sanctioned", value: fmtUSD(summary.sanctioned), sub: `${summary.count} borrowers`, icon: Building2 },
    { label: "Total Outstanding", value: fmtUSD(summary.outstanding), sub: `${utilization.toFixed(1)}% utilization`, icon: Layers },
    { label: "At-Risk Exposure", value: fmtUSD(summary.atRisk), sub: `${atRiskPct.toFixed(1)}% of book`, icon: AlertTriangle, alert: true },
    { label: "Watchlist Borrowers", value: String(watchlistCount), sub: `${((watchlistCount / summary.count) * 100).toFixed(0)}% of names`, icon: ShieldAlert },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((k) => (
        <div key={k.label} className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k.label}</span>
            <k.icon className={cn("h-4 w-4", k.alert ? "text-[var(--band-risk)]" : "text-muted-foreground")} />
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums">{k.value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{k.sub}</div>
        </div>
      ))}

      {/* Band distribution */}
      <div className="rounded-xl border bg-card p-5 shadow-sm sm:col-span-2 lg:col-span-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Outstanding by Risk Band
          </span>
          <span className="text-xs text-muted-foreground">Total {fmtUSD(summary.outstanding)}</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full">
          {(["loyal", "stable", "watch", "risk"] as const).map((b) => {
            const pct = (summary.byBand[b] / summary.outstanding) * 100;
            return (
              <div
                key={b}
                className="h-full"
                style={{ width: `${pct}%`, background: `var(--band-${b})` }}
                title={`${bandMeta(b).label} — ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          {(["loyal", "stable", "watch", "risk"] as const).map((b) => (
            <div key={b} className="flex items-start gap-2">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: `var(--band-${b})` }} />
              <div>
                <div className="text-xs font-medium">{bandMeta(b).label}</div>
                <div className="text-sm font-semibold tabular-nums">{fmtUSD(summary.byBand[b])}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============= Product Snapshot ============= */
function ProductSnapshot({ summary }: { summary: ReturnType<typeof portfolioSummary> }) {
  const products: CorpProduct[] = ["Term Loan", "Working Capital", "Syndicated Loan"];
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-3">Product</th>
            <th className="px-3 py-3 text-right">Facilities</th>
            <th className="px-3 py-3 text-right">Sanctioned</th>
            <th className="px-3 py-3 text-right">Outstanding</th>
            <th className="px-3 py-3 text-right">Utilization</th>
            <th className="px-5 py-3 text-right">Share of Book</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const d = summary.byProduct[p];
            const util = (d.outstanding / d.sanctioned) * 100;
            const share = (d.outstanding / summary.outstanding) * 100;
            return (
              <tr key={p} className="border-b last:border-0">
                <td className="px-5 py-3 font-medium">{p}</td>
                <td className="px-3 py-3 text-right tabular-nums">{d.count}</td>
                <td className="px-3 py-3 text-right tabular-nums">{fmtUSD(d.sanctioned)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{fmtUSD(d.outstanding)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{util.toFixed(1)}%</td>
                <td className="px-5 py-3 text-right">
                  <div className="ml-auto flex max-w-[160px] items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${share}%` }} />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">{share.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
          <tr className="bg-muted/30 font-semibold">
            <td className="px-5 py-3">Total</td>
            <td className="px-3 py-3 text-right tabular-nums">
              {products.reduce((s, p) => s + summary.byProduct[p].count, 0)}
            </td>
            <td className="px-3 py-3 text-right tabular-nums">{fmtUSD(summary.sanctioned)}</td>
            <td className="px-3 py-3 text-right tabular-nums">{fmtUSD(summary.outstanding)}</td>
            <td className="px-3 py-3 text-right tabular-nums">
              {((summary.outstanding / summary.sanctioned) * 100).toFixed(1)}%
            </td>
            <td className="px-5 py-3 text-right tabular-nums">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ============= Concentration ============= */
function ConcentrationPanel({
  summary,
  onSelectCustomer,
}: {
  summary: ReturnType<typeof portfolioSummary>;
  onSelectCustomer: (c: Corporate) => void;
}) {
  const SECTOR_LIMIT_PCT = 20; // % of total book
  const SINGLE_BORROWER_LIMIT_PCT = 8;
  const sectors = Object.entries(summary.bySector)
    .map(([k, v]) => ({ name: k, exposure: v, pct: (v / summary.outstanding) * 100 }))
    .sort((a, b) => b.exposure - a.exposure);

  const topBorrowers = CORPORATES.map((c) => {
    const t = facilityTotals(c);
    return { c, outstanding: t.outstanding, pct: (t.outstanding / summary.outstanding) * 100 };
  })
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 8);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Sector Concentration</h3>
          <span className="text-xs text-muted-foreground">Limit {SECTOR_LIMIT_PCT}%</span>
        </div>
        <div className="space-y-3">
          {sectors.map((s) => {
            const breach = s.pct > SECTOR_LIMIT_PCT;
            const warn = !breach && s.pct > SECTOR_LIMIT_PCT * 0.85;
            return (
              <div key={s.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{s.name}</span>
                  <span
                    className={cn(
                      "tabular-nums",
                      breach && "text-[var(--band-risk)] font-semibold",
                      warn && "text-[var(--band-watch)] font-semibold",
                    )}
                  >
                    {fmtUSD(s.exposure)} · {s.pct.toFixed(1)}%
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min(100, (s.pct / SECTOR_LIMIT_PCT) * 100)}%`,
                      background: breach
                        ? "var(--band-risk)"
                        : warn
                          ? "var(--band-watch)"
                          : "var(--band-stable)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Top Single-Borrower Exposure</h3>
          <span className="text-xs text-muted-foreground">Limit {SINGLE_BORROWER_LIMIT_PCT}%</span>
        </div>
        <div className="space-y-2">
          {topBorrowers.map(({ c, outstanding, pct }) => {
            const breach = pct > SINGLE_BORROWER_LIMIT_PCT;
            return (
              <button
                key={c.id}
                onClick={() => onSelectCustomer(c)}
                className="flex w-full items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-left text-sm transition hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.sector} · {c.rating}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">{fmtUSD(outstanding)}</div>
                  <div
                    className={cn(
                      "text-xs tabular-nums",
                      breach ? "font-semibold text-[var(--band-risk)]" : "text-muted-foreground",
                    )}
                  >
                    {pct.toFixed(2)}% {breach && "· breach"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============= Covenant Alerts ============= */
function CovenantAlerts({ onSelectCustomer }: { onSelectCustomer: (c: Corporate) => void }) {
  const rows = CORPORATES
    .map((c) => ({ c, breaches: c.covenants.filter((cv) => cv.status !== "ok") }))
    .filter((r) => r.breaches.length > 0)
    .sort((a, b) => {
      const sev = (xs: typeof a.breaches) => xs.filter((x) => x.status === "breach").length * 10 + xs.length;
      return sev(b.breaches) - sev(a.breaches);
    });

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-3">Borrower</th>
            <th className="px-3 py-3">Rating</th>
            <th className="px-3 py-3">Covenant</th>
            <th className="px-3 py-3 text-right">Threshold</th>
            <th className="px-3 py-3 text-right">Actual</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-5 py-3 text-right">Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">
                No active covenant breaches.
              </td>
            </tr>
          )}
          {rows.flatMap(({ c, breaches }) =>
            breaches.map((cv, i) => (
              <tr
                key={`${c.id}-${cv.name}`}
                className="cursor-pointer border-b transition hover:bg-muted/40 last:border-0"
                onClick={() => onSelectCustomer(c)}
              >
                {i === 0 ? (
                  <>
                    <td rowSpan={breaches.length} className="px-5 py-3 align-top">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.sector}</div>
                    </td>
                    <td rowSpan={breaches.length} className="px-3 py-3 align-top">
                      <RatingBadge rating={c.rating} />
                    </td>
                  </>
                ) : null}
                <td className="px-3 py-3 font-medium">{cv.name}</td>
                <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{cv.threshold}</td>
                <td className="px-3 py-3 text-right tabular-nums font-semibold">{cv.actual}</td>
                <td className="px-3 py-3">
                  <StatusPill status={cv.status} />
                </td>
                {i === 0 ? (
                  <td rowSpan={breaches.length} className="px-5 py-3 text-right align-top tabular-nums">
                    {fmtUSD(facilityTotals(c).outstanding)}
                  </td>
                ) : null}
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ============= Rating Migration ============= */
function RatingMigration({ onSelectCustomer }: { onSelectCustomer: (c: Corporate) => void }) {
  const moves = CORPORATES
    .map((c) => ({
      c,
      diff: RATING_ORDER.indexOf(c.rating6m) - RATING_ORDER.indexOf(c.rating),
    }))
    .filter((m) => m.diff !== 0)
    .sort((a, b) => b.diff - a.diff);

  const downgrades = moves.filter((m) => m.diff > 0).sort((a, b) => b.diff - a.diff);
  const upgrades = moves.filter((m) => m.diff < 0).sort((a, b) => a.diff - b.diff);

  const Card = ({ title, items, kind }: { title: string; items: typeof moves; kind: "down" | "up" }) => (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          {kind === "down" ? (
            <ArrowDownRight className="h-4 w-4 text-[var(--band-risk)]" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-[var(--band-loyal)]" />
          )}
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <span className="text-xs text-muted-foreground">{items.length} names</span>
      </div>
      <div className="divide-y">
        {items.length === 0 && (
          <div className="px-5 py-6 text-center text-sm text-muted-foreground">No forecasted moves.</div>
        )}
        {items.slice(0, 8).map(({ c }) => (
          <button
            key={c.id}
            onClick={() => onSelectCustomer(c)}
            className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition hover:bg-muted/40"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">
                {c.sector} · PD {c.pd}% → {c.pd6m}%
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RatingBadge rating={c.rating} />
              <span className="text-muted-foreground">→</span>
              <RatingBadge rating={c.rating6m} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Forecast Downgrades (6m)" items={downgrades} kind="down" />
      <Card title="Forecast Upgrades (6m)" items={upgrades} kind="up" />
    </div>
  );
}

/* ============= Action Planner ============= */
function ActionPlanner({ onSelectCustomer }: { onSelectCustomer: (c: Corporate) => void }) {
  const actions: Array<ActionType | "All"> = [
    "All",
    "Covenant Review",
    "Rating Watch",
    "Exposure Reduction",
    "Renewal Discussion",
    "Routine Monitoring",
  ];
  const [filter, setFilter] = useState<ActionType | "All">("All");

  const rows = useMemo(() => {
    const list = CORPORATES.filter((c) => filter === "All" || c.action === filter).map((c) => {
      const t = facilityTotals(c);
      const nextMaturity = c.facilities
        .map((f) => f.maturityDate)
        .sort()[0];
      return { c, ...t, nextMaturity };
    });
    list.sort((a, b) => b.outstanding - a.outstanding);
    return list;
  }, [filter]);

  const exportCSV = () => {
    const header = ["ID", "Borrower", "Sector", "Rating", "Action", "RM", "Sanctioned (USD)", "Outstanding (USD)", "Next Maturity"];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push([
        r.c.id,
        `"${r.c.name}"`,
        r.c.sector,
        r.c.rating,
        r.c.action,
        r.c.rm,
        r.sanctioned,
        r.outstanding,
        r.nextMaturity,
      ].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `corporate-actions-${filter.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((a) => (
            <button
              key={a}
              onClick={() => setFilter(a)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                filter === a
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
              )}
            >
              {a} {a !== "All" && `(${CORPORATES.filter((c) => c.action === a).length})`}
            </button>
          ))}
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV ({rows.length})
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Borrower</th>
              <th className="px-3 py-3">Rating</th>
              <th className="px-3 py-3">Recommended Action</th>
              <th className="px-3 py-3">RM</th>
              <th className="px-3 py-3 text-right">Outstanding</th>
              <th className="px-3 py-3 text-right">Next Maturity</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, outstanding, nextMaturity }) => (
              <tr
                key={c.id}
                onClick={() => onSelectCustomer(c)}
                className="cursor-pointer border-b transition hover:bg-muted/40"
              >
                <td className="px-5 py-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.id} · {c.sector}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <RatingBadge rating={c.rating} />
                </td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                      ACTION_COLORS[c.action],
                    )}
                  >
                    {c.action}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs">{c.rm}</td>
                <td className="px-3 py-3 text-right tabular-nums">{fmtUSDFull(outstanding)}</td>
                <td className="px-3 py-3 text-right text-xs tabular-nums">{nextMaturity}</td>
                <td className="px-5 py-3 text-right">
                  <span className="text-xs font-medium text-accent">Open →</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============= Borrower Detail Drawer ============= */
function CorpDetail({ corp, onClose }: { corp: Corporate; onClose: () => void }) {
  const t = facilityTotals(corp);
  const band = ratingToBand(corp.rating);
  const pdDelta = corp.pd6m - corp.pd;
  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-2xl overflow-y-auto border-l bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bg-card/95 px-6 py-4 backdrop-blur">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold">{corp.name}</h2>
              <RatingBadge rating={corp.rating} />
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {corp.id} · {corp.sector} · {corp.hq} · RM {corp.rm}
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Headline metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Sanctioned" value={fmtUSD(t.sanctioned)} />
            <Stat label="Outstanding" value={fmtUSD(t.outstanding)} />
            <Stat
              label="Probability of Default"
              value={`${corp.pd}%`}
              sub={`6m → ${corp.pd6m}% ${pdDelta > 0 ? "▲" : pdDelta < 0 ? "▼" : ""}`}
              tone={pdDelta > 0 ? "risk" : pdDelta < 0 ? "loyal" : undefined}
            />
            <Stat
              label="Forecast Rating"
              value={corp.rating6m}
              sub={`from ${corp.rating}`}
              tone={
                RATING_ORDER.indexOf(corp.rating6m) > RATING_ORDER.indexOf(corp.rating)
                  ? "risk"
                  : RATING_ORDER.indexOf(corp.rating6m) < RATING_ORDER.indexOf(corp.rating)
                    ? "loyal"
                    : undefined
              }
            />
          </div>

          {/* Action card */}
          <div
            className={cn(
              "rounded-xl border p-4",
              ACTION_COLORS[corp.action].replace("text-", "border-").replace("bg-", "bg-"),
              "bg-card",
            )}
          >
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Recommended Action
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className={cn("text-base font-semibold", ACTION_COLORS[corp.action].split(" ").find((c) => c.startsWith("text-")))}>
                {corp.action}
              </span>
              <span className="text-xs text-muted-foreground">{bandMeta(band).label}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{corp.notes}</p>
          </div>

          {/* Fundamentals */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Financial Covenants</h3>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2">Covenant</th>
                    <th className="px-3 py-2 text-right">Threshold</th>
                    <th className="px-3 py-2 text-right">Actual</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {corp.covenants.map((c) => (
                    <tr key={c.name} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">{c.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{c.threshold}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold">{c.actual}</td>
                      <td className="px-3 py-2"><StatusPill status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Facilities */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Credit Facilities</h3>
            <div className="space-y-2">
              {corp.facilities.map((f) => (
                <div key={f.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{f.product}</span>
                    <span className="text-xs text-muted-foreground">{f.id}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <Mini label="Sanctioned" value={fmtUSD(f.sanctioned)} />
                    <Mini label="Outstanding" value={fmtUSD(f.outstanding)} />
                    <Mini label="Rate" value={`${f.interestRate}%`} />
                    <Mini label="Maturity" value={f.maturityDate} />
                  </div>
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span>Utilization</span>
                      <span className="tabular-nums">{(f.utilization * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${f.utilization * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============= Atoms ============= */
function RatingBadge({ rating }: { rating: Corporate["rating"] }) {
  const band = ratingToBand(rating);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1",
        `bg-[var(--band-${band}-soft)]`,
        `text-[var(--band-${band})]`,
        `ring-[var(--band-${band})]/30`,
      )}
    >
      {rating}
    </span>
  );
}

function StatusPill({ status }: { status: "ok" | "warning" | "breach" }) {
  const map = {
    ok: { label: "Within", token: "loyal" },
    warning: { label: "Tight", token: "watch" },
    breach: { label: "Breach", token: "risk" },
  } as const;
  const m = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        `bg-[var(--band-${m.token}-soft)]`,
        `text-[var(--band-${m.token})]`,
      )}
    >
      {status === "breach" && <AlertTriangle className="h-3 w-3" />}
      {status === "ok" && <TrendingUp className="h-3 w-3" />}
      {m.label}
    </span>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "loyal" | "stable" | "watch" | "risk";
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-lg font-semibold tabular-nums", tone && `text-[var(--band-${tone})]`)}>
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}
