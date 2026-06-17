import { useMemo, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import {
  CORPORATES,
  corpScore,
  corpScore6m,
  facilityTotals,
  ratingToBand,
  bandMeta,
  fmtUSD,
  RATING_ORDER,
  type Corporate,
  type CorpProduct,
  type RiskBand,
} from "@/lib/corporate-data";
import { ScoreBadge } from "./ScoreBadge";
import { CorpAIExplainCell } from "./CorpAIExplainCell";
import { cn } from "@/lib/utils";

type SortKey = "name" | "rating" | "score" | "score6m" | "pd" | "outstanding" | "dscr" | "leverage" | "action";

const BAND_FILTERS: Array<{ id: RiskBand | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "loyal", label: "Prime" },
  { id: "stable", label: "Standard" },
  { id: "watch", label: "Watch" },
  { id: "risk", label: "High Risk" },
];

export function CorpWatchlist({
  onSelect,
  selectedId,
}: {
  onSelect: (c: Corporate) => void;
  selectedId?: string;
}) {
  const [query, setQuery] = useState("");
  const [band, setBand] = useState<RiskBand | "all">("all");
  const [product, setProduct] = useState<CorpProduct | "all">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "outstanding",
    dir: "desc",
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = CORPORATES.filter((c) => {
      const b = ratingToBand(c.rating);
      if (band !== "all" && b !== band) return false;
      if (product !== "all" && !c.facilities.some((f) => f.product === product)) return false;
      if (q && !`${c.name} ${c.sector} ${c.id} ${c.rm}`.toLowerCase().includes(q)) return false;
      return true;
    }).map((c) => {
      const t = facilityTotals(c);
      const products = Array.from(new Set(c.facilities.map((f) => f.product)));
      return { c, outstanding: t.outstanding, sanctioned: t.sanctioned, products };
    });

    list.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      switch (sort.key) {
        case "name":
          return a.c.name.localeCompare(b.c.name) * dir;
        case "rating":
          return (RATING_ORDER.indexOf(a.c.rating) - RATING_ORDER.indexOf(b.c.rating)) * dir;
        case "score":
          return (corpScore(a.c) - corpScore(b.c)) * dir;
        case "score6m":
          return (corpScore6m(a.c) - corpScore6m(b.c)) * dir;
        case "pd":
          return (a.c.pd - b.c.pd) * dir;
        case "dscr":
          return (a.c.dscr - b.c.dscr) * dir;
        case "leverage":
          return (a.c.leverage - b.c.leverage) * dir;
        case "action":
          return a.c.action.localeCompare(b.c.action) * dir;
        case "outstanding":
        default:
          return (a.outstanding - b.outstanding) * dir;
      }
    });
    return list;
  }, [query, band, product, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          {BAND_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setBand(f.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                band === f.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value as CorpProduct | "all")}
            className="rounded-md border bg-background px-2 py-1.5 text-xs"
          >
            <option value="all">All products</option>
            <option value="Term Loan">Term Loan</option>
            <option value="Working Capital">Working Capital</option>
            <option value="Syndicated Loan">Syndicated Loan</option>
          </select>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search borrower, sector, RM…"
              className="w-56 rounded-md border bg-background py-1.5 pl-7 pr-2 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <Th label="Borrower" onClick={() => toggleSort("name")} />
              <Th label="Rating" onClick={() => toggleSort("rating")} />
              <Th label="Score (Now)" onClick={() => toggleSort("score")} />
              <Th label="Score (6M)" onClick={() => toggleSort("score6m")} />
              <th className="px-3 py-3">Products</th>
              <Th label="PD %" align="right" onClick={() => toggleSort("pd")} />
              <Th label="DSCR" align="right" onClick={() => toggleSort("dscr")} />
              <Th label="Leverage" align="right" onClick={() => toggleSort("leverage")} />
              <Th label="Outstanding" align="right" onClick={() => toggleSort("outstanding")} />
              <Th label="Action" onClick={() => toggleSort("action")} />
              <th className="px-3 py-3 text-center">AI Explain</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No borrowers match the current filters.
                </td>
              </tr>
            )}
            {rows.map(({ c, outstanding, products }) => {
              const b = ratingToBand(c.rating);
              const meta = bandMeta(b);
              const pdUp = c.pd6m > c.pd;
              return (
                <tr
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className={cn(
                    "cursor-pointer border-b transition hover:bg-muted/40",
                    selectedId === c.id && "bg-muted/60",
                  )}
                >
                  <td className="px-5 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.id} · {c.sector} · RM {c.rm}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1",
                          `bg-[var(--band-${b}-soft)]`,
                          `text-[var(--band-${b})]`,
                          `ring-[var(--band-${b})]/30`,
                        )}
                        title={`Now: ${meta.label}`}
                      >
                        {c.rating}
                      </span>
                      {(() => {
                        const b6 = ratingToBand(c.rating6m);
                        const meta6 = bandMeta(b6);
                        const nowIdx = RATING_ORDER.indexOf(c.rating);
                        const futIdx = RATING_ORDER.indexOf(c.rating6m);
                        const arrow = futIdx > nowIdx ? "▼" : futIdx < nowIdx ? "▲" : "→";
                        return (
                          <>
                            <span className="text-[10px] text-muted-foreground">{arrow}</span>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1",
                                `bg-[var(--band-${b6}-soft)]`,
                                `text-[var(--band-${b6})]`,
                                `ring-[var(--band-${b6})]/30`,
                              )}
                              title={`6M: ${meta6.label}`}
                            >
                              {c.rating6m}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Now → 6M
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <ScoreBadge score={corpScore(c)} />
                  </td>
                  <td className="px-3 py-3">
                    <ScoreBadge score={corpScore6m(c)} delta={corpScore6m(c) - corpScore(c)} />
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {products.map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    <span>{c.pd}%</span>
                    <span
                      className={cn(
                        "ml-1 text-[11px]",
                        pdUp ? "text-[var(--band-risk)]" : "text-[var(--band-loyal)]",
                      )}
                    >
                      {pdUp ? "▲" : c.pd6m < c.pd ? "▼" : "·"} {c.pd6m}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.dscr.toFixed(2)}x</td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.leverage.toFixed(2)}x</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">
                    {fmtUSD(outstanding)}
                  </td>
                  <td className="px-3 py-3 text-xs">{c.action}</td>
                  <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <CorpAIExplainCell corp={c} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t px-5 py-3 text-xs text-muted-foreground">
        Showing {rows.length} of {CORPORATES.length} borrowers
      </div>
    </div>
  );
}

function Th({
  label,
  align = "left",
  onClick,
}: {
  label: string;
  align?: "left" | "right";
  onClick: () => void;
}) {
  return (
    <th className={cn("px-3 py-3", align === "right" && "text-right")}>
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );
}
