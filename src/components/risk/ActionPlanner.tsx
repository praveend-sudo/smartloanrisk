import { useMemo, useState, useEffect } from "react";
import { BANDS, CUSTOMERS, fmtUSDFull, getBand, type Customer, type ScoreBand } from "@/lib/credit-data";
import { ScoreBadge } from "./ScoreBadge";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionOption {
  band: ScoreBand;
  bandLabel: string;
  color: string;
  action: string;
  key: string;
}

const ACTIONS: ActionOption[] = BANDS.flatMap((b) =>
  b.actions.map((a) => ({
    band: b.id,
    bandLabel: b.label,
    color: b.color,
    action: a,
    key: `${b.id}::${a}`,
  })),
);

function exposureOf(c: Customer) {
  return c.loans.reduce((s, l) => s + l.outstanding, 0);
}

function csvEscape(v: string | number) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCSV(filename: string, rows: Customer[], action: ActionOption) {
  const header = [
    "Customer ID",
    "Full Name",
    "Email",
    "Phone",
    "City",
    "State",
    "Occupation",
    "Annual Income (USD)",
    "Risk Band",
    "Current Score",
    "6-Month Score",
    "Total Exposure (USD)",
    "Loans",
    "Recommended Action",
  ];
  const lines = rows.map((c) => {
    const band = getBand(c.scoreCurrent);
    return [
      c.id,
      c.name,
      c.email,
      c.phone,
      c.city,
      c.state,
      c.occupation,
      c.annualIncome,
      band.label,
      c.scoreCurrent,
      c.score6m,
      Math.round(exposureOf(c)),
      c.loans.map((l) => l.product).join(" | "),
      c.cards.map((cc) => `${cc.network} ****${cc.last4}`).join(" | "),
      action.action,
    ].map(csvEscape).join(",");
  });
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ActionPlanner({ onSelectCustomer }: { onSelectCustomer?: (c: Customer) => void }) {
  const [actionKey, setActionKey] = useState<string>(ACTIONS[0].key);
  const action = useMemo(() => ACTIONS.find((a) => a.key === actionKey)!, [actionKey]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const rows = useMemo(
    () =>
      CUSTOMERS.filter((c) => getBand(c.scoreCurrent).id === action.band).sort(
        (a, b) => a.scoreCurrent - b.scoreCurrent,
      ),
    [action],
  );

  useEffect(() => { setPage(1); }, [actionKey]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalExposure = useMemo(() => rows.reduce((s, c) => s + exposureOf(c), 0), [rows]);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Next Recommended Action — Action Planner
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            Filter customers by recommended action and export KYC list for outreach
          </div>
        </div>
        <button
          onClick={() => downloadCSV(`action-${action.band}-${Date.now()}.csv`, rows, action)}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          Download KYC CSV ({rows.length})
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-xs font-medium text-muted-foreground">Recommended action</label>
        <select
          value={actionKey}
          onChange={(e) => setActionKey(e.target.value)}
          className="min-w-[320px] rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {BANDS.map((b) => (
            <optgroup key={b.id} label={`${b.label} (${b.range})`}>
              {b.actions.map((a) => (
                <option key={`${b.id}::${a}`} value={`${b.id}::${a}`}>
                  {a}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{
            backgroundColor: `color-mix(in oklab, var(--${action.color}) 14%, transparent)`,
            color: `var(--${action.color})`,
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `var(--${action.color})` }} />
          {action.bandLabel}
        </span>
        <span className="text-xs text-muted-foreground">
          {rows.length} customers · {fmtUSDFull(totalExposure)} exposure
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2 text-right">Income</th>
              <th className="px-3 py-2 text-center">Now</th>
              <th className="px-3 py-2 text-center">6M</th>
              <th className="px-3 py-2 text-right">Exposure</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((c) => (
              <tr
                key={c.id}
                onClick={() => onSelectCustomer?.(c)}
                className={cn(
                  "border-b last:border-0 transition hover:bg-secondary/40",
                  onSelectCustomer && "cursor-pointer",
                )}
              >
                <td className="px-3 py-2.5">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.id} · {c.occupation}</div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="text-xs">{c.email}</div>
                  <div className="text-xs text-muted-foreground">{c.phone}</div>
                </td>
                <td className="px-3 py-2.5 text-xs">{c.city}, {c.state}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-xs">{fmtUSDFull(c.annualIncome)}</td>
                <td className="px-3 py-2.5 text-center"><ScoreBadge score={c.scoreCurrent} size="sm" /></td>
                <td className="px-3 py-2.5 text-center"><ScoreBadge score={c.score6m} size="sm" delta={c.score6m - c.scoreCurrent} /></td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fmtUSDFull(exposureOf(c))}</td>
              </tr>
            ))}
            {pagedRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No customers match this action.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t pt-3 mt-3">
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
