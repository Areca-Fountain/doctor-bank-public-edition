// Curated Sri Lankan bank rates for Pro users.
// The data lives in data/sri-lanka-bank-rates.json - your team edits that file daily.
// The whole table is small, so we hand it to the AI as text instead of searching it.

import rates from "@/data/sri-lanka-bank-rates.json";

type Loan = { minRate: number | null; maxRate: number | null; maxTenureYears?: number | null; notes?: string };
type Deposit = { rate: number | null; notes?: string };
type Bank = {
  name: string;
  shortName?: string;
  personalLoan?: Loan;
  housingLoan?: Loan;
  vehicleLoan?: Loan;
  fixedDeposit12Month?: Deposit;
  savingsAccount?: Deposit;
};

const banks = (rates as unknown as { banks: Bank[] }).banks;
export const RATES_LAST_UPDATED: string = (rates as { lastUpdated: string }).lastUpdated;

const pct = (v: number | null | undefined) => (typeof v === "number" ? `${v}%` : "n/a");

const loanLine = (label: string, l?: Loan) =>
  l ? `${label}: ${pct(l.minRate)} - ${pct(l.maxRate)}${l.maxTenureYears ? `, up to ${l.maxTenureYears} yrs` : ""}${l.notes && l.notes !== "SAMPLE" ? ` (${l.notes})` : ""}` : null;

const depLine = (label: string, d?: Deposit) =>
  d ? `${label}: ${pct(d.rate)}${d.notes && d.notes !== "SAMPLE" ? ` (${d.notes})` : ""}` : null;

// Text block that is added to the Pro system prompt
export function buildRatesContext(): string {
  const rows = banks.map((b) =>
    [
      `- ${b.name}`,
      loanLine("Personal loan", b.personalLoan),
      loanLine("Housing loan", b.housingLoan),
      loanLine("Vehicle loan", b.vehicleLoan),
      depLine("12-month fixed deposit", b.fixedDeposit12Month),
      depLine("Savings account", b.savingsAccount),
    ]
      .filter(Boolean)
      .join("\n    ")
  );
  return `Doctor Bank curated Sri Lankan bank data (LKR, interest % per year, last updated ${RATES_LAST_UPDATED}):\n${rows.join("\n")}`;
}