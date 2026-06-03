import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { explainRating } from "@/lib/ai-explain.functions";
import { getBand, type Customer } from "@/lib/credit-data";
import { cn } from "@/lib/utils";

export function AIExplainCell({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const run = useServerFn(explainRating);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(true);
    if (text || loading) return;
    setLoading(true);
    setError(null);
    try {
      const totalLoanOutstanding = customer.loans.reduce((s, l) => s + l.outstanding, 0);
      const totalCardLimit = customer.cards.reduce((s, c) => s + c.creditLimit, 0);
      const totalCardBalance = customer.cards.reduce((s, c) => s + c.balance, 0);
      const allPayments = customer.loans.flatMap((l) => l.payments);
      const latePayments = allPayments.filter((p) => p.status === "Late").length;
      const missedPayments = allPayments.filter((p) => p.status === "Missed").length;
      const productMix = Array.from(new Set(customer.loans.map((l) => l.product)));
      const band = getBand(customer.scoreCurrent);

      const res = await run({
        data: {
          name: customer.name,
          scoreCurrent: customer.scoreCurrent,
          score6m: customer.score6m,
          score12m: customer.score12m,
          band: band.label,
          totalLoanOutstanding,
          totalCardLimit,
          totalCardBalance,
          latePayments,
          missedPayments,
          productMix,
        },
      });
      setText(res.explanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate explanation");
    } finally {
      setLoading(false);
    }
  }

  const band = getBand(customer.scoreCurrent);

  return (
    <>
      <button
        onClick={handleClick}
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
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: `var(--${band.color})` }}>
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
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing customer profile…
                </div>
              )}
              {error && (
                <div className="rounded-md bg-[var(--band-risk-soft)] px-3 py-2 text-sm text-[var(--band-risk)]">
                  {error}
                </div>
              )}
              {text && (
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
              )}
            </div>
            <div className="border-t px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground">
              Generated by AI · Demo data
            </div>
          </div>
        </div>
      )}
    </>
  );
}
