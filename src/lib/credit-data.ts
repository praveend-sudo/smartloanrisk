// Simulated credit risk data for demo purposes

export type ScoreBand = "loyal" | "stable" | "watch" | "risk";

export interface BandMeta {
  id: ScoreBand;
  label: string;
  range: string;
  min: number;
  max: number;
  share: number; // % of portfolio
  actions: string[];
  color: string; // token name
}

export const BANDS: BandMeta[] = [
  {
    id: "loyal",
    label: "High-Value Loyalists",
    range: "750–999",
    min: 750,
    max: 999,
    share: 15,
    color: "band-loyal",
    actions: [
      "Proactive credit limit increase",
      "Cross-sell: trade finance & savings",
      "Priority RM — retain before competitor",
    ],
  },
  {
    id: "stable",
    label: "Stable Mass Market",
    range: "600–749",
    min: 600,
    max: 749,
    share: 40,
    color: "band-stable",
    actions: [
      "Targeted digital loan top-up offers",
      "Seasonal agricultural finance",
      "Insurance bundling + digital engagement",
    ],
  },
  {
    id: "watch",
    label: "Early-Warning Watch",
    range: "400–599",
    min: 400,
    max: 599,
    share: 30,
    color: "band-watch",
    actions: [
      "Immediate soft action triggers",
      "Restructuring offers before first miss",
      "Enhanced daily score monitoring",
    ],
  },
  {
    id: "risk",
    label: "High-Risk Recovery",
    range: "0–399",
    min: 0,
    max: 399,
    share: 15,
    color: "band-risk",
    actions: [
      "Credit limit reduction & freeze",
      "Score-guided settlement offers",
      "Legal routing for non-recoverables",
    ],
  },
];

export function getBand(score: number): BandMeta {
  return BANDS.find((b) => score >= b.min && score <= b.max) ?? BANDS[3];
}

export type LoanProduct =
  | "Mortgage"
  | "Auto Loan"
  | "Personal Loan"
  | "Home Equity LOC"
  | "Student Loan"
  | "SBA Business Loan"
  | "Agricultural Loan"
  | "Trade Finance";

export interface CreditCard {
  id: string;
  network: "Visa Signature" | "Mastercard World" | "Amex Platinum" | "Visa Platinum";
  last4: string;
  creditLimit: number;
  balance: number;
  minPayment: number;
  apr: number;
  status: "Current" | "30 DPD" | "60 DPD" | "90+ DPD";
}

export interface PaymentRecord {
  date: string;
  amount: number;
  status: "Paid" | "Late" | "Missed";
  method: "ACH" | "Wire" | "Card" | "Check";
}

export interface Loan {
  id: string;
  product: LoanProduct;
  principal: number;
  outstanding: number;
  installment: number;
  termMonths: number;
  remainingMonths: number;
  apr: number;
  originated: string;
  payments: PaymentRecord[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  occupation: string;
  annualIncome: number;
  scoreCurrent: number;
  score6m: number;
  score12m: number;
  loans: Loan[];
  cards: CreditCard[];
}

// ---- Deterministic pseudo-random for stable demo data ----
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const FIRST = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
  "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
  "Matthew", "Margaret", "Anthony", "Sandra", "Mark", "Ashley", "Donald", "Kimberly",
  "Steven", "Emily", "Paul", "Donna", "Andrew", "Michelle", "Joshua", "Carol",
];
const LAST = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
  "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
];
const CITIES: Array<[string, string]> = [
  ["New York", "NY"], ["Los Angeles", "CA"], ["Chicago", "IL"], ["Houston", "TX"],
  ["Phoenix", "AZ"], ["Philadelphia", "PA"], ["San Antonio", "TX"], ["San Diego", "CA"],
  ["Dallas", "TX"], ["Austin", "TX"], ["Jacksonville", "FL"], ["Columbus", "OH"],
  ["Charlotte", "NC"], ["Indianapolis", "IN"], ["Seattle", "WA"], ["Denver", "CO"],
  ["Boston", "MA"], ["Nashville", "TN"], ["Portland", "OR"], ["Atlanta", "GA"],
];
const OCCUPATIONS = [
  "Software Engineer", "Physician", "Attorney", "Teacher", "Accountant",
  "Marketing Director", "Construction Manager", "Registered Nurse", "Realtor",
  "Small Business Owner", "Financial Analyst", "Operations Manager", "Architect",
  "Sales Executive", "Civil Engineer", "Restaurant Owner", "Pharmacist",
];
const PRODUCTS: LoanProduct[] = [
  "Mortgage", "Auto Loan", "Personal Loan", "Home Equity LOC", "Student Loan",
  "SBA Business Loan", "Agricultural Loan", "Trade Finance",
];

function pick<T>(arr: T[], r: () => number) {
  return arr[Math.floor(r() * arr.length)];
}

function makePayments(rand: () => number, installment: number, count: number, scoreBand: ScoreBand): PaymentRecord[] {
  const out: PaymentRecord[] = [];
  const today = new Date(2026, 5, 1);
  const lateProb =
    scoreBand === "loyal" ? 0.04 : scoreBand === "stable" ? 0.14 : scoreBand === "watch" ? 0.32 : 0.55;
  const missProb =
    scoreBand === "loyal" ? 0.01 : scoreBand === "stable" ? 0.04 : scoreBand === "watch" ? 0.15 : 0.35;
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    const r = rand();
    const status: PaymentRecord["status"] =
      r < missProb ? "Missed" : r < missProb + lateProb ? "Late" : "Paid";
    out.push({
      date: d.toISOString().slice(0, 10),
      amount: status === "Missed" ? 0 : Math.round(installment),
      status,
      method: pick(["ACH", "Wire", "Card", "Check"] as const, rand),
    });
  }
  return out;
}

function makeCustomer(seed: number): Customer {
  const rand = mulberry32(seed);
  const first = pick(FIRST, rand);
  const last = pick(LAST, rand);
  const name = `${first} ${last}`;
  const [city, state] = pick(CITIES, rand);
  const score = Math.floor(rand() * 1000);
  const band = getBand(score).id;

  // Volatile predictive deltas: wider swings, occasional shock moves & rebounds.
  const shock = rand() < 0.18 ? (rand() < 0.5 ? -1 : 1) * (80 + rand() * 180) : 0;
  const rebound = band !== "loyal" && rand() < 0.15 ? rand() * 140 : 0;
  const baseDrift6 =
    band === "loyal" ? rand() * 90 - 60
    : band === "stable" ? rand() * 140 - 80
    : band === "watch" ? rand() * 160 - 130
    : rand() * 180 - 150;
  const drift6 = baseDrift6 + shock + rebound;
  const drift12 = drift6 * (0.6 + rand() * 1.8) + (rand() * 120 - 60);
  const score6m = Math.max(0, Math.min(999, Math.round(score + drift6)));
  const score12m = Math.max(0, Math.min(999, Math.round(score + drift12)));

  const numLoans = 1 + Math.floor(rand() * 4);
  const loans: Loan[] = [];
  for (let i = 0; i < numLoans; i++) {
    const product = pick(PRODUCTS, rand);
    // Volatility multiplier — occasional jumbo / micro outliers.
    const vol = rand() < 0.12 ? 0.2 + rand() * 0.4 : rand() < 0.12 ? 2 + rand() * 2.5 : 0.7 + rand() * 0.9;
    const baseAmount = Math.round((
      product === "Mortgage" ? 180000 + Math.floor(rand() * 820000)
      : product === "Auto Loan" ? 12000 + Math.floor(rand() * 78000)
      : product === "Home Equity LOC" ? 20000 + Math.floor(rand() * 260000)
      : product === "SBA Business Loan" ? 50000 + Math.floor(rand() * 750000)
      : product === "Agricultural Loan" ? 35000 + Math.floor(rand() * 520000)
      : product === "Trade Finance" ? 80000 + Math.floor(rand() * 1500000)
      : product === "Student Loan" ? 5000 + Math.floor(rand() * 95000)
      : 3000 + Math.floor(rand() * 65000)
    ) * vol);
    const termMonths =
      product === "Mortgage" ? 360
      : product === "Auto Loan" ? 60
      : product === "Student Loan" ? 120
      : product === "SBA Business Loan" ? 84
      : 48;
    const remaining = Math.floor(rand() * termMonths * 0.95) + 3;
    const apr = 2.9 + rand() * 14;
    const monthly = apr / 100 / 12;
    const installment = (baseAmount * monthly) / (1 - Math.pow(1 + monthly, -termMonths));
    const outstanding = Math.round(installment * remaining * (0.55 + rand() * 0.55));
    loans.push({
      id: `LN-${seed}-${i}`,
      product,
      principal: baseAmount,
      outstanding,
      installment: Math.round(installment),
      termMonths,
      remainingMonths: remaining,
      apr: Math.round(apr * 100) / 100,
      originated: `20${20 + Math.floor(rand() * 5)}-${String(1 + Math.floor(rand() * 12)).padStart(2, "0")}-15`,
      payments: makePayments(rand, installment, 12, band),
    });
  }

  const numCards = 1 + Math.floor(rand() * 4);
  const cards: CreditCard[] = [];
  for (let i = 0; i < numCards; i++) {
    const limitVol = rand() < 0.15 ? 3 + rand() * 3 : 0.6 + rand() * 1.2;
    const limit = Math.round((3000 + rand() * 55000) * limitVol / 500) * 500;
    const utilBase =
      band === "loyal" ? rand() * 0.35
      : band === "stable" ? 0.1 + rand() * 0.6
      : band === "watch" ? 0.35 + rand() * 0.6
      : 0.55 + rand() * 0.5;
    const utilization = Math.max(0, Math.min(1.1, utilBase + (rand() - 0.5) * 0.3));
    const balance = Math.round(limit * utilization);
    cards.push({
      id: `CC-${seed}-${i}`,
      network: pick(["Visa Signature", "Mastercard World", "Amex Platinum", "Visa Platinum"] as const, rand),
      last4: String(1000 + Math.floor(rand() * 9000)),
      creditLimit: limit,
      balance,
      minPayment: Math.max(35, Math.round(balance * 0.03)),
      apr: Math.round((14 + rand() * 18) * 100) / 100,
      status:
        band === "risk" && rand() > 0.35 ? "90+ DPD"
        : band === "risk" && rand() > 0.55 ? "60 DPD"
        : band === "watch" && rand() > 0.5 ? "30 DPD"
        : band === "stable" && rand() > 0.92 ? "30 DPD"
        : "Current",
    });
  }

  const incomeVol = rand() < 0.1 ? 2 + rand() * 4 : 0.5 + rand() * 1.3;
  return {
    id: `C-${10000 + seed}`,
    name,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${pick(["gmail.com", "outlook.com", "yahoo.com", "icloud.com"], rand)}`,
    phone: `(${200 + Math.floor(rand() * 700)}) ${100 + Math.floor(rand() * 900)}-${1000 + Math.floor(rand() * 9000)}`,
    city,
    state,
    occupation: pick(OCCUPATIONS, rand),
    annualIncome: Math.round((40000 + rand() * 400000) * incomeVol / 1000) * 1000,
    scoreCurrent: score,
    score6m,
    score12m,
    loans,
    cards,
  };
}

export const CUSTOMERS: Customer[] = Array.from({ length: 48 }, (_, i) =>
  makeCustomer(hash(`fidem-customer-${i}`)),
);

export function portfolioStats(customers: Customer[], scoreField: "scoreCurrent" | "score6m" | "score12m" = "scoreCurrent") {
  let totalLoanAmount = 0;
  let totalOutstanding = 0;
  let totalCardLimit = 0;
  let totalCardBalance = 0;
  const bandCounts: Record<ScoreBand, number> = { loyal: 0, stable: 0, watch: 0, risk: 0 };
  const bandExposure: Record<ScoreBand, number> = { loyal: 0, stable: 0, watch: 0, risk: 0 };

  for (const c of customers) {
    const b = getBand(c[scoreField]).id;
    bandCounts[b]++;
    for (const l of c.loans) {
      totalLoanAmount += l.principal;
      totalOutstanding += l.outstanding;
      bandExposure[b] += l.outstanding;
    }
    for (const cc of c.cards) {
      totalCardLimit += cc.creditLimit;
      totalCardBalance += cc.balance;
      bandExposure[b] += cc.balance;
    }
  }
  return {
    totalLoanAmount,
    totalOutstanding,
    totalCardLimit,
    totalCardBalance,
    bandCounts,
    bandExposure,
    atRiskExposure: bandExposure.watch + bandExposure.risk,
  };
}

export interface ProductStat {
  product: LoanProduct | "Credit Cards";
  loanBook: number;
  outstanding: number;
  atRiskExposure: number;
  duePayments: number;
  loanCount: number;
}

export function productStats(
  customers: Customer[],
  scoreField: "scoreCurrent" | "score6m" | "score12m" = "scoreCurrent",
): ProductStat[] {
  const map = new Map<ProductStat["product"], ProductStat>();
  const ensure = (key: ProductStat["product"]): ProductStat => {
    let s = map.get(key);
    if (!s) {
      s = { product: key, loanBook: 0, outstanding: 0, atRiskExposure: 0, duePayments: 0, loanCount: 0 };
      map.set(key, s);
    }
    return s;
  };

  for (const c of customers) {
    const band = getBand(c[scoreField]).id;
    const atRisk = band === "watch" || band === "risk";

    for (const l of c.loans) {
      const s = ensure(l.product);
      s.loanBook += l.principal;
      s.outstanding += l.outstanding;
      s.loanCount += 1;
      if (atRisk) s.atRiskExposure += l.outstanding;
      for (const p of l.payments) {
        if (p.status !== "Paid") s.duePayments += l.installment;
      }
    }

    for (const cc of c.cards) {
      const s = ensure("Credit Cards");
      s.loanBook += cc.creditLimit;
      s.outstanding += cc.balance;
      s.loanCount += 1;
      if (atRisk) s.atRiskExposure += cc.balance;
      if (cc.status !== "Current") s.duePayments += cc.minPayment;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.outstanding - a.outstanding);
}



export const fmtUSD = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(1)}K`
    : `$${n.toFixed(0)}`;

export const fmtUSDFull = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
