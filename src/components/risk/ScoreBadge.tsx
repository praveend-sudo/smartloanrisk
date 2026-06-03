import { getBand } from "@/lib/credit-data";
import { cn } from "@/lib/utils";

const TOKENS: Record<string, { bg: string; fg: string; ring: string }> = {
  loyal: { bg: "bg-[var(--band-loyal-soft)]", fg: "text-[var(--band-loyal)]", ring: "ring-[var(--band-loyal)]/30" },
  stable: { bg: "bg-[var(--band-stable-soft)]", fg: "text-[var(--band-stable)]", ring: "ring-[var(--band-stable)]/30" },
  watch: { bg: "bg-[var(--band-watch-soft)]", fg: "text-[var(--band-watch)]", ring: "ring-[var(--band-watch)]/30" },
  risk: { bg: "bg-[var(--band-risk-soft)]", fg: "text-[var(--band-risk)]", ring: "ring-[var(--band-risk)]/30" },
};

export function ScoreBadge({
  score,
  size = "md",
  showLabel = false,
  delta,
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  delta?: number;
}) {
  const band = getBand(score);
  const t = TOKENS[band.id];
  const sz =
    size === "sm" ? "text-xs px-2 py-0.5"
    : size === "lg" ? "text-2xl px-4 py-2 font-semibold"
    : "text-sm px-2.5 py-1 font-medium";

  return (
    <div className="inline-flex items-center gap-2">
      <span className={cn("inline-flex items-center rounded-md ring-1", t.bg, t.fg, t.ring, sz)}>
        <span className="tabular-nums">{score}</span>
        {showLabel && <span className="ml-2 text-[10px] uppercase tracking-wider opacity-80">{band.label}</span>}
      </span>
      {delta !== undefined && delta !== 0 && (
        <span
          className={cn(
            "text-xs font-medium tabular-nums",
            delta > 0 ? "text-[var(--band-loyal)]" : "text-[var(--band-risk)]",
          )}
        >
          {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
        </span>
      )}
    </div>
  );
}
