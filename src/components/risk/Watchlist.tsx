import { useMemo, useState } from "react";
import { CUSTOMERS, fmtUSDFull, getBand, type Customer } from "@/lib/credit-data";
import { ScoreBadge } from "./ScoreBadge";
import { cn } from "@/lib/utils";
import { AIExplainCell } from "./AIExplainCell";

export function Watchlist({
  onSelect,
  selectedId,
}: {
  onSelect: (c: Customer) => void;
  selectedId?: string;
}) {
  const [filter, setFilter] = useState<"all" | "watch" | "risk">("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return CUSTOMERS.filter((c) => {
      const b = getBand(c.scoreCurrent).id;
      if (filter === "watch" && b !== "watch") return false;
      if (filter === "risk" && b !== "risk") return false;
      if (q && !c.name.toLowerCase().includes(q.toLowerCase()) && !c.id.toLowerCase().includes(q.toLowerCase()))
        return false;
      return true;
    })
      .map((c) => {
        const principal = c.loans.reduce((s, l) => s + l.principal, 0);
        const installment = c.loans.reduce((s, l) => s + l.installment, 0);
        return { c, principal, installment };
      })
      .sort((a, b) => a.c.score12m - b.c.score12m);
  }, [filter, q]);

  const FilterBtn = ({ id, label }: { id: typeof filter; label: string }) => (
    <button
      onClick={() => setFilter(id)}
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-medium transition",
        filter === id
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Customer Watchlist</h2>
          <p className="text-xs text-muted-foreground">
            Probabilistic 6 & 12-month risk forecast · click a row for full customer file
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or ID…"
            className="h-8 rounded-md border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring"
          />
          <FilterBtn id="all" label="All" />
          <FilterBtn id="watch" label="Early-Warning" />
          <FilterBtn id="risk" label="High-Risk" />
          <FilterBtn id="drop" label="Predicted Drop" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 text-left font-medium">Customer</th>
              <th className="px-3 py-3 text-left font-medium">Current</th>
              <th className="px-3 py-3 text-left font-medium">6-Month Forecast</th>
              <th className="px-3 py-3 text-left font-medium">12-Month Forecast</th>
              <th className="px-3 py-3 text-right font-medium">Loan Amount</th>
              <th className="px-3 py-3 text-right font-medium">Installment</th>
              <th className="px-3 py-3 text-center font-medium">AI Explain</th>
              <th className="px-5 py-3 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, principal, installment }) => {
              const selected = c.id === selectedId;
              return (
                <tr
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className={cn(
                    "cursor-pointer border-b transition hover:bg-muted/40",
                    selected && "bg-accent/10",
                  )}
                >
                  <td className="px-5 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.id} · {c.city}, {c.state}
                    </div>
                  </td>
                  <td className="px-3 py-3"><ScoreBadge score={c.scoreCurrent} /></td>
                  <td className="px-3 py-3">
                    <ScoreBadge score={c.score6m} delta={c.score6m - c.scoreCurrent} />
                  </td>
                  <td className="px-3 py-3">
                    <ScoreBadge score={c.score12m} delta={c.score12m - c.scoreCurrent} />
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{fmtUSDFull(principal)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{fmtUSDFull(installment)}/mo</td>
                  <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <AIExplainCell customer={c} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-xs font-medium text-accent">View →</span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No customers match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
