import { useMemo, useState } from "react";
import { Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  bandMeta,
  corpScore,
  corpScore6m,
  facilityTotals,
  fmtUSD,
  ratingToBand,
  type Corporate,
} from "@/lib/corporate-data";
import { cn } from "@/lib/utils";

function buildExplanation(c: Corporate): string {
  const score = corpScore(c);
  const score6 = corpScore6m(c);
  const delta = score6 - score;
  const band = bandMeta(ratingToBand(c.rating));
  const t = facilityTotals(c);
  const products = Array.from(new Set(c.facilities.map((f) => f.product)));
  const util = t.sanctioned > 0 ? Math.round((t.outstanding / t.sanctioned) * 100) : 0;
  const dir =
    delta > 15 ? "improvement" : delta < -15 ? "deterioration" : "stable performance";

  const narrative = `**${c.name}** (${c.sector}, ${c.hq}) holds a smart credit score of **${score}/999** in the **${band.label}** tier. The 6-month forecast moves to **${score6}** (${delta >= 0 ? "+" : ""}${delta} pts) — ${dir}. Total exposure across ${products.length} facility line${products.length > 1 ? "s" : ""} is **${fmtUSD(t.outstanding)} outstanding** of ${fmtUSD(t.sanctioned)} sanctioned (${util}% utilization). PD trajectory: ${c.pd}% → ${c.pd6m}%.`;

  const driverPool: Array<{ w: number; line: string }> = [
    {
      w: score < 400 ? 100 : score < 600 ? 75 : 30,
      line: `**Smart credit score** of **${score}/999** places the borrower in the ${band.label} tier ${score < 400 ? "— immediate recovery action required" : score < 600 ? "— enhanced monitoring warranted" : "— within acceptable risk appetite"}.`,
    },
    {
      w: c.dscr < 1.25 ? 90 : c.dscr < 1.5 ? 55 : 30,
      line: `**Debt servicing capacity** — DSCR of **${c.dscr.toFixed(2)}x** ${c.dscr >= 1.5 ? "comfortably covers fixed charges" : c.dscr >= 1.25 ? "meets minimum threshold with limited buffer" : "is below the 1.25x policy floor and signals stress"}.`,
    },
    {
      w: c.leverage > 4 ? 85 : c.leverage > 3 ? 50 : 25,
      line: `**Balance-sheet leverage** — Debt/EBITDA at **${c.leverage.toFixed(2)}x** ${c.leverage <= 3.5 ? "is within the prudent range" : c.leverage <= 4 ? "is approaching the prudent ceiling" : "is elevated and constrains incremental capacity"}.`,
    },
    {
      w: Math.abs(c.pd6m - c.pd) > 1 ? 75 : 35,
      line: `**Default probability migration** — PD moves from **${c.pd}% → ${c.pd6m}%** over 6 months, ${c.pd6m > c.pd ? "indicating rising default risk" : c.pd6m < c.pd ? "indicating improving credit quality" : "remaining flat"}.`,
    },
    {
      w: util > 85 ? 70 : util > 65 ? 45 : 25,
      line: `**Facility utilization** — ${util}% drawn (${fmtUSD(t.outstanding)} of ${fmtUSD(t.sanctioned)}) across ${products.join(", ")} ${util > 85 ? "leaves minimal undrawn buffer for working-capital shocks" : "retains adequate undrawn headroom"}.`,
    },
    {
      w: Math.abs(delta) > 30 ? 80 : 40,
      line: `**Forecast trajectory** — Score change of **${delta >= 0 ? "+" : ""}${delta} pts (6mo)** projects a ${delta < -30 ? "downward migration into a weaker band" : delta > 30 ? "upgrade into a stronger band" : "hold within the current band"}.`,
    },
  ];

  const top3 = driverPool.sort((a, b) => b.w - a.w).slice(0, 3);
  const drivers = top3.map((d, i) => `${i + 1}. ${d.line}`).join("\n");
  return `### Risk Narrative\n${narrative}\n\n### Top 3 Drivers\n${drivers}`;
}

export function CorpAIExplainCell({ corp }: { corp: Corporate }) {
  const [open, setOpen] = useState(false);
  const text = useMemo(() => buildExplanation(corp), [corp]);
  const b = ratingToBand(corp.rating);
  const score = corpScore(corp);
  const score6 = corpScore6m(corp);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition hover:bg-accent/10",
          `border-[var(--band-${b}-soft)] text-[var(--band-${b})]`,
        )}
        title="AI explanation of this score"
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
              style={{ backgroundColor: `var(--band-${b}-soft)` }}
            >
              <div>
                <div
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: `var(--band-${b})` }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Score Explanation
                </div>
                <div className="mt-1 text-sm font-semibold text-foreground">{corp.name}</div>
                <div className="text-xs text-muted-foreground">
                  {bandMeta(b).label} · Smart Score {score} → {score6} (6mo)
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
