import { useMemo } from "react";
import { CUSTOMERS, fmtUSD, productStats } from "@/lib/credit-data";
import type { Period } from "./PortfolioKPIs";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Building2,
  Car,
  Wallet,
  Home,
  GraduationCap,
  Briefcase,
  Sprout,
  Ship,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Mortgage: Home,
  "Auto Loan": Car,
  "Personal Loan": Wallet,
  "Home Equity LOC": Building2,
  "Student Loan": GraduationCap,
  "SBA Business Loan": Briefcase,
  "Agricultural Loan": Sprout,
  "Trade Finance": Ship,
  "Credit Cards": CreditCard,
};

const PERIOD_FIELD = {
  current: "scoreCurrent",
  "6m": "score6m",
  "12m": "score12m",
} as const;

export function ProductBreakdown({
  period,
  onPeriodChange,
}: {
  period: Period;
  onPeriodChange: (p: Period) => void;
}) {
  const stats = useMemo(() => productStats(CUSTOMERS, PERIOD_FIELD[period]), [period]);

  const totals = useMemo(
    () =>
      stats.reduce(
        (a, s) => ({
          loanBook: a.loanBook + s.loanBook,
          outstanding: a.outstanding + s.outstanding,
          atRiskExposure: a.atRiskExposure + s.atRiskExposure,
          duePayments: a.duePayments + s.duePayments,
        }),
        { loanBook: 0, outstanding: 0, atRiskExposure: 0, duePayments: 0 },
      ),
    [stats],
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Product-Wise Portfolio Snapshot
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              Loan book, outstanding, at-risk exposure & due payments by product
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <Legend label="Loan Book" tone="foreground" />
            <Legend label="Outstanding" tone="primary" />
            <Legend label="At-Risk" tone="risk" />
            <Legend label="Due Payments" tone="watch" />
            <div className="ml-2 flex items-center gap-1.5">
              {(["current", "6m", "12m"] as const).map((id) => (
                <button
                  key={id}
                  onClick={() => onPeriodChange(id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition",
                    period === id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                  )}
                >
                  {id === "current" ? "Now" : id === "6m" ? "6M" : "12M"}
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2 text-right">Loans</th>
                <th className="px-3 py-2 text-right">Loan Book</th>
                <th className="px-3 py-2 text-right">Outstanding</th>
                <th className="px-3 py-2 text-right">At-Risk Exposure</th>
                <th className="px-3 py-2 text-right">Due Payments</th>
                <th className="px-3 py-2">Risk Share</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => {
                const Icon = ICONS[s.product] ?? Wallet;
                const riskPct = s.outstanding > 0 ? (s.atRiskExposure / s.outstanding) * 100 : 0;
                return (
                  <tr key={s.product} className="border-b last:border-0 transition hover:bg-secondary/40">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-foreground/80">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-medium">{s.product}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{s.loanCount}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium">{fmtUSD(s.loanBook)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-primary">{fmtUSD(s.outstanding)}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-[var(--band-risk)]">
                      {fmtUSD(s.atRiskExposure)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-[var(--band-watch)]">
                      {fmtUSD(s.duePayments)}
                    </td>
                    <td className="px-3 py-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                              <div
                                className="h-full bg-[var(--band-risk)]"
                                style={{ width: `${Math.min(100, riskPct)}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground">{riskPct.toFixed(1)}%</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-card text-foreground border shadow-lg">
                          <div className="text-xs">
                            {fmtUSD(s.atRiskExposure)} of {fmtUSD(s.outstanding)} outstanding is in watch or risk bands
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="text-xs font-semibold uppercase tracking-wider">
                <td className="px-3 pt-3 text-muted-foreground">Total</td>
                <td className="px-3 pt-3" />
                <td className="px-3 pt-3 text-right tabular-nums">{fmtUSD(totals.loanBook)}</td>
                <td className="px-3 pt-3 text-right tabular-nums text-primary">{fmtUSD(totals.outstanding)}</td>
                <td className="px-3 pt-3 text-right tabular-nums text-[var(--band-risk)]">
                  {fmtUSD(totals.atRiskExposure)}
                </td>
                <td className="px-3 pt-3 text-right tabular-nums text-[var(--band-watch)]">
                  {fmtUSD(totals.duePayments)}
                </td>
                <td className="px-3 pt-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </TooltipProvider>
  );
}

function Legend({ label, tone }: { label: string; tone: "foreground" | "primary" | "risk" | "watch" }) {
  const color =
    tone === "primary"
      ? "var(--primary)"
      : tone === "risk"
        ? "var(--band-risk)"
        : tone === "watch"
          ? "var(--band-watch)"
          : "var(--foreground)";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
