import { useMemo, useState } from "react";
import { CUSTOMERS, fmtUSDFull, getBand, type Customer, type LoanProduct } from "@/lib/credit-data";
import { ScoreBadge } from "./ScoreBadge";
import { cn } from "@/lib/utils";
import { AIExplainCell } from "./AIExplainCell";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

const PRODUCT_OPTIONS: Array<LoanProduct | "All"> = [
  "All",
  "Mortgage",
  "Auto Loan",
  "Personal Loan",
  "Home Equity LOC",
  "Student Loan",
  "SBA Business Loan",
  "Agricultural Loan",
  "Trade Finance",
];

export function Watchlist({
  onSelect,
  selectedId,
}: {
  onSelect: (c: Customer) => void;
  selectedId?: string;
}) {
  const [filter, setFilter] = useState<"all" | "watch" | "risk">("all");
  const [product, setProduct] = useState<LoanProduct | "All">("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ col: string; dir: "asc" | "desc" }>({
    col: "score12m",
    dir: "asc",
  });

  const rows = useMemo(() => {
    const filtered = CUSTOMERS.filter((c) => {
      const b = getBand(c.scoreCurrent).id;
      if (filter === "watch" && b !== "watch") return false;
      if (filter === "risk" && b !== "risk") return false;
      if (product !== "All" && !c.loans.some((l) => l.product === product)) return false;
      if (q && !c.name.toLowerCase().includes(q.toLowerCase()) && !c.id.toLowerCase().includes(q.toLowerCase()))
        return false;
      return true;
    }).map((c) => {
      const matchingLoans = product === "All" ? c.loans : c.loans.filter((l) => l.product === product);
      const principal = matchingLoans.reduce((s, l) => s + l.principal, 0);
      const installment = matchingLoans.reduce((s, l) => s + l.installment, 0);
      return { c, principal, installment };
    });

    const { col, dir } = sort;
    const m = dir === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      switch (col) {
        case "name": return a.c.name.localeCompare(b.c.name) * m;
        case "scoreCurrent": return (a.c.scoreCurrent - b.c.scoreCurrent) * m;
        case "score6m": return (a.c.score6m - b.c.score6m) * m;
        case "score12m": return (a.c.score12m - b.c.score12m) * m;
        case "principal": return (a.principal - b.principal) * m;
        case "installment": return (a.installment - b.installment) * m;
        default: return 0;
      }
    });
    return filtered;
  }, [filter, product, q, sort]);

  const SortHeader = ({
    col,
    children,
    align = "left",
    className,
  }: {
    col: string;
    children: React.ReactNode;
    align?: "left" | "right" | "center";
    className?: string;
  }) => {
    const active = sort.col === col;
    const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
    const alignClass =
      align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
    return (
      <th
        className={cn("cursor-pointer select-none px-3 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground", alignClass, className)}
        onClick={() =>
          setSort((s) => ({
            col,
            dir: s.col === col && s.dir === "asc" ? "desc" : "asc",
          }))
        }
      >
        <span className="inline-flex items-center gap-1">
          {children}
          <Icon className={cn("h-3 w-3", active && "text-primary")} />
        </span>
      </th>
    );
  };

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
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or ID…"
            className="h-8 rounded-md border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value as LoanProduct | "All")}
            className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
            title="Filter by loan product"
          >
            {PRODUCT_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p === "All" ? "All products" : p}
              </option>
            ))}
          </select>
          <FilterBtn id="all" label="All" />
          <FilterBtn id="watch" label="Early-Warning" />
          <FilterBtn id="risk" label="High-Risk" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <SortHeader col="name" className="px-5">Customer</SortHeader>
              <SortHeader col="scoreCurrent">Current</SortHeader>
              <SortHeader col="score6m">6-Month Forecast</SortHeader>
              <SortHeader col="score12m">12-Month Forecast</SortHeader>
              <SortHeader col="principal" align="right">Loan Amount</SortHeader>
              <SortHeader col="installment" align="right">Installment</SortHeader>
              <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">AI Explain</th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground" />
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
