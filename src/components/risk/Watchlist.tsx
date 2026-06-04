import { useMemo, useState, useEffect } from "react";
import { CUSTOMERS, fmtUSDFull, getBand, type Customer, type LoanProduct } from "@/lib/credit-data";
import { ScoreBadge } from "./ScoreBadge";
import { cn } from "@/lib/utils";
import { AIExplainCell } from "./AIExplainCell";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";

const PRODUCT_OPTIONS: Array<LoanProduct | "All"> = [
  "All",
  "Mortgage",
  "Auto Loan",
  "Personal Loan",
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
    col: "score6m",
    dir: "asc",
  });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

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
      const products = Array.from(new Set(matchingLoans.map((l) => l.product)));
      return { c, principal, installment, products };
    });

    const { col, dir } = sort;
    const m = dir === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      switch (col) {
        case "name": return a.c.name.localeCompare(b.c.name) * m;
        case "scoreCurrent": return (a.c.scoreCurrent - b.c.scoreCurrent) * m;
        case "score6m": return (a.c.score6m - b.c.score6m) * m;
        case "principal": return (a.principal - b.principal) * m;
        case "installment": return (a.installment - b.installment) * m;
        default: return 0;
      }
    });
    return filtered;
  }, [filter, product, q, sort]);

  useEffect(() => { setPage(1); }, [filter, product, q, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            Probabilistic 6-month risk forecast · click a row for full customer file
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
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Loan Product</th>
              <SortHeader col="scoreCurrent">Current</SortHeader>
              <SortHeader col="score6m">6-Month Forecast</SortHeader>
              <SortHeader col="principal" align="right">Loan Amount</SortHeader>
              <SortHeader col="installment" align="right">Installment</SortHeader>
              <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">AI Explain</th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground" />
            </tr>
          </thead>
          <tbody>
            {pagedRows.map(({ c, principal, installment, products }) => {
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
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {products.map((p) => (
                        <span
                          key={p}
                          className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3"><ScoreBadge score={c.scoreCurrent} /></td>
                  <td className="px-3 py-3">
                    <ScoreBadge score={c.score6m} delta={c.score6m - c.scoreCurrent} />
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
            {pagedRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No customers match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t px-5 py-3">
          <span className="text-xs text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2.5 text-xs font-medium transition hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <span className="text-xs tabular-nums text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2.5 text-xs font-medium transition hover:bg-muted disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
