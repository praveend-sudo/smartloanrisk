import { useMemo, useState } from "react";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { CUSTOMERS, BANDS, type LoanProduct } from "@/lib/credit-data";

const PRODUCTS: LoanProduct[] = [
  "Mortgage",
  "Auto Loan",
  "Personal Loan",
];

// Distinct hues for product lines (independent of risk-band colors)
const PRODUCT_COLORS: Record<LoanProduct, string> = {
  "Mortgage": "#2563eb",
  "Auto Loan": "#16a34a",
  "Personal Loan": "#f59e0b",
};

export function ProductRiskChart() {
  const [selected, setSelected] = useState<Set<LoanProduct>>(
    new Set<LoanProduct>(["Mortgage", "Auto Loan", "Personal Loan"]),
  );

  // Aggregate avg weighted score per product per time bucket
  const data = useMemo(() => {
    // For each product, weight by exposure (loan principal)
    const buckets: Record<LoanProduct, { now: { s: number; w: number }; m6: { s: number; w: number } }> = {} as never;
    for (const p of PRODUCTS) buckets[p] = { now: { s: 0, w: 0 }, m6: { s: 0, w: 0 } };

    for (const c of CUSTOMERS) {
      for (const l of c.loans) {
        const w = l.principal;
        buckets[l.product].now.s += c.scoreCurrent * w;
        buckets[l.product].now.w += w;
        buckets[l.product].m6.s += c.score6m * w;
        buckets[l.product].m6.w += w;
      }
    }

    // Deterministic seeded RNG per product so history is stable across renders
    const rand = (seed: number) => {
      let s = seed >>> 0;
      return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0xffffffff;
      };
    };
    const hash = (str: string) => {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    };

    const monthLabels = ["-6m", "-5m", "-4m", "-3m", "-2m", "-1m", "Now", "+3m", "+6m"];
    const points: Array<Record<string, number | string>> = monthLabels.map((label) => ({ label }));

    for (const p of PRODUCTS) {
      const b = buckets[p];
      const now = b.now.w ? b.now.s / b.now.w : 0;
      const m6 = b.m6.w ? b.m6.s / b.m6.w : 0;
      const rng = rand(hash(p));
      // Start 6 months ago with a drift offset, walk toward Now
      const startOffset = (rng() - 0.5) * 80; // ±40 pts
      const start = Math.max(0, Math.min(999, now + startOffset));
      // 7 historical+current points (-6m .. Now)
      for (let i = 0; i < 7; i++) {
        const t = i / 6;
        const trend = start + (now - start) * t;
        const jitter = (rng() - 0.5) * 22; // monthly volatility
        points[i][p] = Math.round(Math.max(0, Math.min(999, trend + jitter)));
      }
      // Override Now to exact current value
      points[6][p] = Math.round(now);
      // Forecast: +3m as midpoint with jitter, +6m exact
      const mid = now + (m6 - now) * 0.5 + (rng() - 0.5) * 12;
      points[7][p] = Math.round(Math.max(0, Math.min(999, mid)));
      points[8][p] = Math.round(m6);
    }
    return points;
  }, []);

  const toggle = (p: LoanProduct) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Loan Product Risk Movement
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            Exposure-weighted Smart Credit Score — 6 months of prior predictions, current, and 6-month forecast
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {PRODUCTS.map((p) => {
          const on = selected.has(p);
          return (
            <button
              key={p}
              onClick={() => toggle(p)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition " +
                (on ? "bg-secondary" : "opacity-50 hover:opacity-100")
              }
              style={on ? { borderColor: PRODUCT_COLORS[p], color: PRODUCT_COLORS[p] } : undefined}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: PRODUCT_COLORS[p] }}
              />
              {p}
            </button>
          );
        })}
      </div>

      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            {/* Risk band shaded backgrounds */}
            {BANDS.map((b) => (
              <ReferenceArea
                key={b.id}
                y1={b.min}
                y2={b.max}
                fill={`var(--${b.color})`}
                fillOpacity={0.06}
                ifOverflow="hidden"
              />
            ))}
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 999]} tick={{ fontSize: 12 }} width={40} />
            <RTooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {PRODUCTS.filter((p) => selected.has(p)).map((p) => (
              <Line
                key={p}
                type="monotone"
                dataKey={p}
                stroke={PRODUCT_COLORS[p]}
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span>Shaded bands:</span>
        {BANDS.map((b) => (
          <span key={b.id} className="inline-flex items-center gap-1">
            <span
              className="h-2 w-3 rounded-sm"
              style={{ backgroundColor: `var(--${b.color})`, opacity: 0.4 }}
            />
            {b.label} ({b.range})
          </span>
        ))}
      </div>
    </div>
  );
}
