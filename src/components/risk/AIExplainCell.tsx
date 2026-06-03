import { useMemo, useState } from "react";
import { Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getBand, type Customer } from "@/lib/credit-data";
import { cn } from "@/lib/utils";

function buildExplanation(customer: Customer): string {
  const band = getBand(customer.scoreCurrent);
  const totalLoanOutstanding = customer.loans.reduce((s, l) => s + l.outstanding, 0);
  const totalCardLimit = customer.cards.reduce((s, c) => s + c.creditLimit, 0);
  const totalCardBalance = customer.cards.reduce((s, c) => s + c.balance, 0);
  const util = totalCardLimit ? Math.round((totalCardBalance / totalCardLimit) * 100) : 0;
  const allPayments = customer.loans.flatMap((l) => l.payments);
  const late = allPayments.filter((p) => p.status === "Late").length;
  const missed = allPayments.filter((p) => p.status === "Missed").length;
  const products = Array.from(new Set(customer.loans.map((l) => l.product)));
  const delta6 = customer.score6m - customer.scoreCurrent;
  const delta12 = customer.score12m - customer.scoreCurrent;
  const dir = (d: number) => (d > 5 ? "improvement" : d < -5 ? "deterioration" : "stable performance");
  const fmt = (n: number) => `$${n.toLocaleString()}`;

  const narrative = `${customer.name} currently sits in the **${band.label}** tier with a score of **${customer.scoreCurrent}/999**. Forecasts indicate ${dir(delta6)} over 6 months (${delta6 >= 0 ? "+" : ""}${delta6} pts) and ${dir(delta12)} over 12 months (${delta12 >= 0 ? "+" : ""}${delta12} pts). Combined exposure across ${products.length} loan product${products.length > 1 ? "s" : ""} totals ${fmt(totalLoanOutstanding)} outstanding, with revolving card utilization at ${util}%.`;

  const driverPool: Array<{ key: string; weight: number; line: string }> = [
    {
      key: "util",
      weight: util > 70 ? 95 : util > 40 ? 60 : 25,
      line: `**Card utilization ${util}%** — ${fmt(totalCardBalance)} balance against ${fmt(totalCardLimit)} limit ${util > 70 ? "is well above the 30% healthy threshold" : util > 40 ? "exceeds the recommended 30% threshold" : "remains within healthy range"}.`,
    },
    {
      key: "missed",
      weight: missed > 0 ? 90 + missed * 5 : 10,
      line: `**${missed} missed payment${missed === 1 ? "" : "s"}** in the last 12 months ${missed > 0 ? "is the strongest single negative signal in the file" : "keeps the on-time history intact"}.`,
    },
    {
      key: "late",
      weight: late > 2 ? 75 : late > 0 ? 50 : 20,
      line: `**${late} late payment${late === 1 ? "" : "s"}** recorded across ${allPayments.length} scheduled installments ${late > 0 ? "indicates intermittent cash-flow stress" : "reflects consistent on-time behavior"}.`,
    },
    {
      key: "exposure",
      weight: totalLoanOutstanding > 200000 ? 70 : totalLoanOutstanding > 80000 ? 45 : 30,
      line: `**${fmt(totalLoanOutstanding)} loan exposure** across ${products.join(", ")} ${totalLoanOutstanding > 200000 ? "concentrates significant balance-sheet risk on this single obligor" : "represents a moderate concentration"}.`,
    },
    {
      key: "income",
      weight: 40,
      line: `**Annual income ${fmt(customer.annualIncome)}** (${customer.occupation}) yields a debt-to-income profile that ${customer.annualIncome > totalLoanOutstanding / 2 ? "supports current servicing comfortably" : "leaves limited headroom for shocks"}.`,
    },
    {
      key: "trend",
      weight: Math.abs(delta12) > 30 ? 80 : 35,
      line: `**Predictive trajectory ${delta12 >= 0 ? "+" : ""}${delta12} pts (12mo)** suggests the customer is ${delta12 < -30 ? "drifting into a higher-risk band" : delta12 > 30 ? "migrating toward a stronger band" : "expected to remain within the current band"}.`,
    },
  ];

  const top3 = driverPool.sort((a, b) => b.weight - a.weight).slice(0, 3);
  const drivers = top3.map((d, i) => `${i + 1}. ${d.line}`).join("\n");

  return `### Risk Narrative\n${narrative}\n\n### Top 3 Drivers\n${drivers}`;
}

export function AIExplainCell({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);
  const text = useMemo(() => buildExplanation(customer), [customer]);
  const band = getBand(customer.scoreCurrent);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition",
          "hover:bg-accent/10 hover:border-accent",
        )}
        style={{ color: `var(--${band.color})`, borderColor: `var(--${band.color}-soft)` }}
        title="AI explanation of this rating"
      >
        <Sparkles className="h-3 w-3" />
        Explain
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl border bg-card shadow-2xl"
          >
            <div
              className="flex items-start justify-between gap-3 border-b px-5 py-4"
              style={{ backgroundColor: `var(--${band.color}-soft)` }}
            >
              <div>
                <div
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: `var(--${band.color})` }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Rating Explanation
                </div>
                <div className="mt-1 text-sm font-semibold text-foreground">{customer.name}</div>
                <div className="text-xs text-muted-foreground">
                  {band.label} · Score {customer.scoreCurrent} → {customer.score6m} (6mo) → {customer.score12m} (12mo)
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 hover:bg-background/60"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4 min-h-[140px]">
              <div
                className={cn(
                  "text-sm leading-relaxed text-foreground space-y-3",
                  "[&_h3]:text-xs [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:text-muted-foreground [&_h3]:mt-3 [&_h3]:mb-1.5",
                  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1",
                  "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1",
                  "[&_strong]:font-semibold [&_strong]:text-foreground",
                  "[&_p]:my-1",
                )}
              >
                <ReactMarkdown>{text}</ReactMarkdown>
              </div>
            </div>
            <div className="border-t px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground">
              Demo explanation · Simulated data
            </div>
          </div>
        </div>
      )}
    </>
  );
}
