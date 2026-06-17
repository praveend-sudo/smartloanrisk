// Synthetic corporate loan portfolio data

export type CorpProduct = "Term Loan" | "Working Capital" | "Syndicated Loan";
export type CorpRating = "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC";
export type RiskBand = "loyal" | "stable" | "watch" | "risk";

export const RATING_ORDER: CorpRating[] = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC"];

export function ratingToBand(r: CorpRating): RiskBand {
  if (r === "AAA" || r === "AA") return "loyal";
  if (r === "A" || r === "BBB") return "stable";
  if (r === "BB") return "watch";
  return "risk";
}

export interface CorpFacility {
  id: string;
  product: CorpProduct;
  sanctioned: number; // USD
  outstanding: number;
  utilization: number; // 0-1
  interestRate: number; // %
  startDate: string;
  maturityDate: string;
  tenorMonths: number;
}

export interface CovenantStatus {
  name: string;
  threshold: string;
  actual: string;
  status: "ok" | "warning" | "breach";
}

export type ActionType =
  | "Covenant Review"
  | "Renewal Discussion"
  | "Exposure Reduction"
  | "Rating Watch"
  | "Routine Monitoring";

export interface Corporate {
  id: string;
  name: string;
  sector: string;
  hq: string;
  group?: string;
  rating: CorpRating;
  ratingPrev: CorpRating;
  rating6m: CorpRating; // forecast
  pd: number; // probability of default, %
  pd6m: number;
  facilities: CorpFacility[];
  dscr: number; // debt service coverage ratio
  leverage: number; // debt / EBITDA
  currentRatio: number;
  covenants: CovenantStatus[];
  rm: string;
  action: ActionType;
  notes: string;
}

const SECTORS = [
  "Manufacturing",
  "Real Estate",
  "Energy & Utilities",
  "Technology",
  "Healthcare",
  "Logistics",
  "Retail & Consumer",
  "Construction",
  "Hospitality",
  "Agribusiness",
];

const HQ = [
  "New York, NY",
  "Chicago, IL",
  "Houston, TX",
  "San Francisco, CA",
  "Atlanta, GA",
  "Boston, MA",
  "Seattle, WA",
  "Charlotte, NC",
  "Dallas, TX",
  "Miami, FL",
];

const NAMES: Array<[string, string, string]> = [
  ["Atlas Industrial Holdings", "Manufacturing", "Chicago, IL"],
  ["Beacon Energy Partners", "Energy & Utilities", "Houston, TX"],
  ["Cresta BioPharma", "Healthcare", "Boston, MA"],
  ["Drayton Logistics Corp", "Logistics", "Atlanta, GA"],
  ["Evergreen Agro Group", "Agribusiness", "Dallas, TX"],
  ["Foundry Steelworks", "Manufacturing", "Pittsburgh, PA"],
  ["Granite Realty Trust", "Real Estate", "New York, NY"],
  ["Helios Renewable Power", "Energy & Utilities", "San Francisco, CA"],
  ["Ionix Semiconductor", "Technology", "Seattle, WA"],
  ["Juniper Hospitality REIT", "Hospitality", "Miami, FL"],
  ["Kestrel Aerospace Systems", "Manufacturing", "Wichita, KS"],
  ["Lakeshore Foods Inc.", "Retail & Consumer", "Minneapolis, MN"],
  ["Meridian Construction Co.", "Construction", "Denver, CO"],
  ["Northbridge Pharma", "Healthcare", "Philadelphia, PA"],
  ["Orion Data Centers", "Technology", "Ashburn, VA"],
  ["Pinegrove Timber Holdings", "Agribusiness", "Portland, OR"],
  ["Quartz Mining Resources", "Energy & Utilities", "Salt Lake City, UT"],
  ["Riverbend Specialty Chemicals", "Manufacturing", "Charlotte, NC"],
  ["Sentinel Defense Systems", "Manufacturing", "Arlington, VA"],
  ["Tidewater Shipping Lines", "Logistics", "Norfolk, VA"],
  ["Umbra Media Networks", "Technology", "Los Angeles, CA"],
  ["Vanguard Hotels & Resorts", "Hospitality", "Las Vegas, NV"],
  ["Westmoor Property Group", "Real Estate", "Chicago, IL"],
  ["Xylo Packaging Industries", "Manufacturing", "Cincinnati, OH"],
  ["Yarrow Renewable Fuels", "Energy & Utilities", "Tulsa, OK"],
  ["Zenith Retail Holdings", "Retail & Consumer", "Atlanta, GA"],
  ["Arcadia Wellness Group", "Healthcare", "San Diego, CA"],
  ["Brightline Rail Partners", "Logistics", "Orlando, FL"],
  ["Copperline Telecom", "Technology", "Dallas, TX"],
  ["Delta Marine Foods", "Retail & Consumer", "Seattle, WA"],
];

// deterministic PRNG
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(0xC0FFEE);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const between = (a: number, b: number) => a + rand() * (b - a);

function nextRating(r: CorpRating, dir: number): CorpRating {
  const i = RATING_ORDER.indexOf(r);
  const j = Math.max(0, Math.min(RATING_ORDER.length - 1, i + dir));
  return RATING_ORDER[j];
}

function pdForRating(r: CorpRating) {
  const map: Record<CorpRating, number> = {
    AAA: 0.05, AA: 0.12, A: 0.4, BBB: 1.2, BB: 4.5, B: 9.0, CCC: 22.0,
  };
  return +(map[r] * between(0.85, 1.2)).toFixed(2);
}

// Fixed reference date so SSR and client render identical content
const REF_DATE = new Date("2026-06-01T00:00:00Z");

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function addMonths(d: Date, m: number): Date {
  const r = new Date(d);
  r.setUTCMonth(r.getUTCMonth() + m);
  return r;
}

function makeFacility(idx: number, product: CorpProduct, ratingMult: number): CorpFacility {
  const baseMap: Record<CorpProduct, [number, number]> = {
    "Term Loan": [25_000_000, 220_000_000],
    "Working Capital": [10_000_000, 90_000_000],
    "Syndicated Loan": [120_000_000, 850_000_000],
  };
  const [lo, hi] = baseMap[product];
  const sanctioned = Math.round(between(lo, hi) * ratingMult / 100_000) * 100_000;
  const utilization = +between(0.45, 0.95).toFixed(2);
  const outstanding = Math.round(sanctioned * utilization / 100_000) * 100_000;
  const tenor = product === "Working Capital" ? pick([12, 18, 24]) : pick([36, 48, 60, 84, 120]);
  const startMonthsAgo = Math.floor(between(2, tenor - 3));
  const start = addMonths(REF_DATE, -startMonthsAgo);
  const maturity = addMonths(start, tenor);
  return {
    id: `FAC-${idx}`,
    product,
    sanctioned,
    outstanding,
    utilization,
    interestRate: +between(4.5, 9.5).toFixed(2),
    startDate: start.toISOString().slice(0, 10),
    maturityDate: maturity.toISOString().slice(0, 10),
    tenorMonths: tenor,
  };
}


function makeCovenants(dscr: number, leverage: number, cr: number): CovenantStatus[] {
  const s = (ok: boolean, warn: boolean): CovenantStatus["status"] =>
    ok ? "ok" : warn ? "warning" : "breach";
  return [
    {
      name: "DSCR",
      threshold: "≥ 1.25x",
      actual: `${dscr.toFixed(2)}x`,
      status: s(dscr >= 1.4, dscr >= 1.25),
    },
    {
      name: "Debt / EBITDA",
      threshold: "≤ 4.00x",
      actual: `${leverage.toFixed(2)}x`,
      status: s(leverage <= 3.5, leverage <= 4.0),
    },
    {
      name: "Current Ratio",
      threshold: "≥ 1.20x",
      actual: `${cr.toFixed(2)}x`,
      status: s(cr >= 1.4, cr >= 1.2),
    },
  ];
}

const RMS = ["S. Pereira", "M. Chen", "J. Okafor", "A. Rossi", "K. Patel", "L. Hwang", "D. Müller", "R. Singh"];

function makeCorporate(i: number, entry: [string, string, string]): Corporate {
  const [name, sector, hq] = entry;
  // weighted rating distribution
  const r = rand();
  const rating: CorpRating =
    r < 0.08 ? "AAA"
    : r < 0.22 ? "AA"
    : r < 0.45 ? "A"
    : r < 0.68 ? "BBB"
    : r < 0.85 ? "BB"
    : r < 0.95 ? "B"
    : "CCC";
  const ratingMult = rating === "AAA" ? 140 : rating === "AA" ? 130 : rating === "A" ? 120
    : rating === "BBB" ? 110 : rating === "BB" ? 95 : rating === "B" ? 80 : 60;

  const productCount = pick([1, 2, 2, 3]);
  const productPool: CorpProduct[] = ["Term Loan", "Working Capital", "Syndicated Loan"];
  const shuffled = shuffle(productPool).slice(0, productCount);
  const facilities = shuffled.map((p, idx) => makeFacility(i * 10 + idx, p, ratingMult));

  // Fundamentals correlated with rating
  const ratingIdx = RATING_ORDER.indexOf(rating);
  const dscr = +between(1.05 + (6 - ratingIdx) * 0.18, 1.4 + (6 - ratingIdx) * 0.22).toFixed(2);
  const leverage = +between(2.2 + ratingIdx * 0.35, 3.5 + ratingIdx * 0.55).toFixed(2);
  const currentRatio = +between(0.95 + (6 - ratingIdx) * 0.08, 1.2 + (6 - ratingIdx) * 0.12).toFixed(2);

  // 6-month forecast: substantial migration (~70% of names move, mostly downgrades,
  // with multi-notch jumps for stressed credits). Investment-grade names also drift.
  const roll = rand();
  let drift = 0;
  if (ratingIdx <= 1) {
    // AAA/AA: mild downgrade pressure
    drift = roll < 0.55 ? 1 : roll < 0.7 ? 2 : 0;
  } else if (ratingIdx <= 3) {
    // A/BBB: meaningful migration toward sub-IG
    drift = roll < 0.45 ? 1 : roll < 0.7 ? 2 : roll < 0.8 ? -1 : 0;
  } else if (ratingIdx === 4) {
    // BB: heavy downgrade risk
    drift = roll < 0.5 ? 1 : roll < 0.8 ? 2 : roll < 0.9 ? -1 : 0;
  } else {
    // B / CCC: stressed — large downgrades or rare recoveries
    drift = roll < 0.55 ? 1 : roll < 0.85 ? 2 : roll < 0.95 ? -1 : 0;
  }
  const rating6m = nextRating(rating, drift);
  const ratingPrev = nextRating(rating, rand() < 0.25 ? -1 : 0);

  const covenants = makeCovenants(dscr, leverage, currentRatio);
  const breached = covenants.some((c) => c.status === "breach");
  const warning = covenants.some((c) => c.status === "warning");

  let action: ActionType = "Routine Monitoring";
  if (breached) action = "Covenant Review";
  else if (drift > 0) action = "Rating Watch";
  else if (warning && ratingIdx >= 4) action = "Exposure Reduction";
  else {
    // upcoming maturity
    const soonest = facilities.reduce(
      (min, f) => Math.min(min, +new Date(f.maturityDate) - +REF_DATE),
      Infinity,
    );
    if (soonest < 1000 * 60 * 60 * 24 * 270) action = "Renewal Discussion";
  }


  const notesPool = [
    "Q3 earnings beat consensus; cash conversion improving.",
    "Pending refinancing of senior notes in next quarter.",
    "Sector headwinds from input-cost inflation under review.",
    "Recently completed bolt-on acquisition; integration on track.",
    "Site visit scheduled with CFO and Treasurer.",
    "ESG rating upgraded by external agency this quarter.",
    "Litigation overhang resolved; provisions released.",
  ];

  return {
    id: `CORP-${String(1000 + i)}`,
    name,
    sector,
    hq,
    group: rand() < 0.25 ? `${name.split(" ")[0]} Group` : undefined,
    rating,
    ratingPrev,
    rating6m,
    pd: pdForRating(rating),
    pd6m: pdForRating(rating6m),
    facilities,
    dscr,
    leverage,
    currentRatio,
    covenants,
    rm: pick(RMS),
    action,
    notes: pick(notesPool),
  };
}

export const CORPORATES: Corporate[] = NAMES.map((n, i) => makeCorporate(i, n));

export function facilityTotals(c: Corporate) {
  return c.facilities.reduce(
    (acc, f) => {
      acc.sanctioned += f.sanctioned;
      acc.outstanding += f.outstanding;
      return acc;
    },
    { sanctioned: 0, outstanding: 0 },
  );
}

export type CorpPeriod = "current" | "6m";

export function portfolioSummary(period: CorpPeriod = "current") {
  let sanctioned = 0;
  let outstanding = 0;
  let atRisk = 0;
  const bySector: Record<string, number> = {};
  const byProduct: Record<
    CorpProduct,
    { sanctioned: number; outstanding: number; count: number; atRisk: number }
  > = {
    "Term Loan": { sanctioned: 0, outstanding: 0, count: 0, atRisk: 0 },
    "Working Capital": { sanctioned: 0, outstanding: 0, count: 0, atRisk: 0 },
    "Syndicated Loan": { sanctioned: 0, outstanding: 0, count: 0, atRisk: 0 },
  };
  const byBand: Record<RiskBand, number> = { loyal: 0, stable: 0, watch: 0, risk: 0 };
  const countByBand: Record<RiskBand, number> = { loyal: 0, stable: 0, watch: 0, risk: 0 };

  for (const c of CORPORATES) {
    const t = facilityTotals(c);
    sanctioned += t.sanctioned;
    outstanding += t.outstanding;
    const rating = period === "6m" ? c.rating6m : c.rating;
    const band = ratingToBand(rating);
    byBand[band] += t.outstanding;
    countByBand[band] += 1;
    const isAtRisk = band === "watch" || band === "risk";
    if (isAtRisk) atRisk += t.outstanding;
    bySector[c.sector] = (bySector[c.sector] ?? 0) + t.outstanding;
    for (const f of c.facilities) {
      byProduct[f.product].sanctioned += f.sanctioned;
      byProduct[f.product].outstanding += f.outstanding;
      byProduct[f.product].count += 1;
      if (isAtRisk) byProduct[f.product].atRisk += f.outstanding;
    }
  }
  return {
    sanctioned,
    outstanding,
    atRisk,
    bySector,
    byProduct,
    byBand,
    countByBand,
    count: CORPORATES.length,
    period,
  };
}

export function fmtUSD(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function fmtUSDFull(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function bandMeta(b: RiskBand) {
  return {
    loyal: { label: "Investment Grade — Prime", token: "loyal" },
    stable: { label: "Investment Grade — Standard", token: "stable" },
    watch: { label: "Sub-Investment — Watch", token: "watch" },
    risk: { label: "High Risk — Action Required", token: "risk" },
  }[b];
}
