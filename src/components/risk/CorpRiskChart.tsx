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
import { CORPORATES, RATING_ORDER, type CorpProduct } from "@/lib/corporate-data";

const PRODUCTS: CorpProduct[] = ["Term Loan", "Working Capital", "Syndicated Loan"];

const PRODUCT_COLORS: Record<CorpProduct, string> = {
  "Term Loan": "#2563eb",
  "Working Capital": "#16a34a",
  "Syndicated Loan": "#f59e0b",
};

// PD bands (probability of default %) — shaded backgrounds
const PD_BANDS = [
  { id: "prime", label: "Prime", min: 0, max: 0.5, color: "band-loyal" },
  { id: "standard", label: "Standard", min: 0.5, max: 3, color: "band-stable" },
  { id: "watch", label: "Watch", min: 3, max: 8, color: "band-watch" },
  { id: "risk", label: "High Risk", min: 8, max: 25, color: "band-risk" },
] as const;

export function CorpRiskChart() {
  const [selected, setSelected] = useState<Set<CorpProduct>>(
    new Set<CorpProduct>(PRODUCTS),
  );

  const data = useMemo(() => {
    const buckets: Record<CorpProduct, { now: { s: number; w: number }; m6: { s: number; w: number } }> = {
      "Term Loan": { now: { s: 0, w: 0 }, m6: { s: 0, w: 0 } },
      "Working Capital": { now: { s: 0, w: 0 }, m6: { s: 0, w: 0 } },
      "Syndicated Loan": { now: { s: 0, w: 0 }, m6: { s: 0, w: 0 } },
    };

    for (const c of CORPORATES) {
      for (const f of c.facilities) {
        const w = f.outstanding;
        buckets[f.product].now.s += c.pd * w;
        buckets[f.product].now.w += w;
        buckets[f.product].m6.s += c.pd6m * w;
        buckets[f.product].m6.w += w;
      }
    }

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
      const startOffset = (rng() - 0.5) * 1.2;
      const start = Math.max(0, now + startOffset);
      for (let i = 0; i < 7; i++) {
        const t = i / 6;
        const trend = start + (now - start) * t;
        const jitter = (rng() - 0.5) * 0.4;
        points[i][p] = +Math.max(0, trend + jitter).toFixed(2);
      }
      points[6][p] = +now.toFixed(2);
      const mid = now + (m6 - now) * 0.5 + (rng() - 0.5) * 0.25;
      points[7][p] = +Math.max(0, mid).toFixed(2);
      points[8][p] = +m6.toFixed(2);
    }
    return points;
  }, []);

  const toggle = (p: CorpProduct) => {
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
            Corporate Product Risk Movement
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            Exposure-weighted Probability of Default (%) — historical, current, and 6-month forecast
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Rating scale: {RATING_ORDER.join(" · ")}
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
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRODUCT_COLORS[p] }} />
              {p}
            </button>
          );
        })}
      </div>

      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            {PD_BANDS.map((b) => (
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
            <YAxis
              domain={[0, 12]}
              tick={{ fontSize: 12 }}
              width={40}
              tickFormatter={(v) => `${v}%`}
            />
            <RTooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => `${v}%`}
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
        <span>PD bands:</span>
        {PD_BANDS.map((b) => (
          <span key={b.id} className="inline-flex items-center gap-1">
            <span
              className="h-2 w-3 rounded-sm"
              style={{ backgroundColor: `var(--${b.color})`, opacity: 0.4 }}
            />
            {b.label} ({b.min}–{b.max}%)
          </span>
        ))}
      </div>
    </div>
  );
}
