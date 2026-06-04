import { fmtUSDFull, getBand, type Customer } from "@/lib/credit-data";
import { ScoreBadge } from "./ScoreBadge";
import { cn } from "@/lib/utils";

export function CustomerDetail({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const band = getBand(customer.scoreCurrent);
  const totalLoanOutstanding = customer.loans.reduce((s, l) => s + l.outstanding, 0);
  const totalLoanBook = customer.loans.reduce((s, l) => s + l.principal, 0);
  const totalInstallment = customer.loans.reduce((s, l) => s + l.installment, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-4xl overflow-y-auto bg-background shadow-2xl">
        {/* Header */}
        <div
          className="border-b px-6 py-5"
          style={{ backgroundColor: `var(--${band.color}-soft)` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider" style={{ color: `var(--${band.color})` }}>
                {band.label} · Score {band.range}
              </div>
              <h2 className="mt-1 text-2xl font-semibold text-foreground">{customer.name}</h2>
              <div className="mt-1 text-sm text-muted-foreground">
                {customer.id} · {customer.occupation} · {customer.city}, {customer.state}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary"
            >
              Close ✕
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <ScoreCard label="Current Score" score={customer.scoreCurrent} />
            <ScoreCard label="6-Month Forecast" score={customer.score6m} delta={customer.score6m - customer.scoreCurrent} />
          </div>
        </div>

        {/* Profile + recommended actions */}
        <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 md:col-span-2">
            <h3 className="text-sm font-semibold">Profile</h3>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Row label="Email" value={customer.email} />
              <Row label="Phone" value={customer.phone} />
              <Row label="Annual Income" value={fmtUSDFull(customer.annualIncome)} />
              <Row label="Loan Outstanding" value={fmtUSDFull(totalLoanOutstanding)} />
              <Row label="Card Limit" value={fmtUSDFull(totalCardLimit)} />
              <Row label="Card Balance" value={fmtUSDFull(totalCardBalance)} />
            </dl>
          </div>
          <div
            className="rounded-lg border p-4"
            style={{ backgroundColor: `var(--${band.color}-soft)` }}
          >
            <h3 className="text-sm font-semibold" style={{ color: `var(--${band.color})` }}>
              Recommended Actions
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {band.actions.map((a) => (
                <li key={a} className="flex gap-2">
                  <span style={{ color: `var(--${band.color})` }}>●</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Loans */}
        <div className="px-6 pb-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Loans ({customer.loans.length})
          </h3>
          <div className="space-y-4">
            {customer.loans.map((l) => (
              <div key={l.id} className="rounded-lg border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold">{l.product}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.id} · Originated {l.originated} · {l.remainingMonths}/{l.termMonths} mo remaining · {l.apr}% APR
                    </div>
                  </div>
                  <div className="flex gap-6 text-right">
                    <Stat label="Principal" value={fmtUSDFull(l.principal)} />
                    <Stat label="Outstanding" value={fmtUSDFull(l.outstanding)} />
                    <Stat label="Installment" value={`${fmtUSDFull(l.installment)}/mo`} />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2 text-left font-medium">Date</th>
                        <th className="px-4 py-2 text-left font-medium">Method</th>
                        <th className="px-4 py-2 text-right font-medium">Amount</th>
                        <th className="px-4 py-2 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {l.payments.slice(-6).reverse().map((p, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-2 tabular-nums">{p.date}</td>
                          <td className="px-4 py-2 text-muted-foreground">{p.method}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{fmtUSDFull(p.amount)}</td>
                          <td className="px-4 py-2 text-right">
                            <span
                              className={cn(
                                "rounded px-2 py-0.5 text-xs font-medium",
                                p.status === "Paid" && "bg-[var(--band-loyal-soft)] text-[var(--band-loyal)]",
                                p.status === "Late" && "bg-[var(--band-watch-soft)] text-[var(--band-watch)]",
                                p.status === "Missed" && "bg-[var(--band-risk-soft)] text-[var(--band-risk)]",
                              )}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="px-6 pb-10">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Credit Cards ({customer.cards.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {customer.cards.map((c) => {
              const util = (c.balance / c.creditLimit) * 100;
              return (
                <div key={c.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{c.network}</div>
                      <div className="text-xs text-muted-foreground">•••• {c.last4} · {c.apr}% APR</div>
                    </div>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-xs font-medium",
                        c.status === "Current" && "bg-[var(--band-loyal-soft)] text-[var(--band-loyal)]",
                        c.status === "30 DPD" && "bg-[var(--band-watch-soft)] text-[var(--band-watch)]",
                        c.status === "60 DPD" && "bg-[var(--band-watch-soft)] text-[var(--band-watch)]",
                        c.status === "90+ DPD" && "bg-[var(--band-risk-soft)] text-[var(--band-risk)]",
                      )}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <Stat label="Credit Limit" value={fmtUSDFull(c.creditLimit)} />
                    <Stat label="Balance" value={fmtUSDFull(c.balance)} />
                    <Stat label="Min Payment" value={fmtUSDFull(c.minPayment)} />
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Utilization</span>
                      <span className="tabular-nums">{util.toFixed(0)}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, util)}%`,
                          backgroundColor:
                            util < 30 ? "var(--band-loyal)"
                            : util < 60 ? "var(--band-stable)"
                            : util < 85 ? "var(--band-watch)"
                            : "var(--band-risk)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, score, delta }: { label: string; score: number; delta?: number }) {
  return (
    <div className="rounded-lg border bg-background/70 p-3 backdrop-blur-sm">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2"><ScoreBadge score={score} size="lg" delta={delta} /></div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
