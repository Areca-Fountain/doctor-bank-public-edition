// Server-only helper for reading data from the Sentry REST API.
// The token lives in SENTRY_API_TOKEN and is NEVER sent to the browser:
// only app/api/admin/sentry/route.ts imports this file, and that route is admin-only.

const API_BASE = (process.env.SENTRY_API_BASE || "https://us.sentry.io").replace(/\/$/, "");
export const SENTRY_ORG = process.env.SENTRY_ORG || "areca-3n";
export const SENTRY_PROJECT = process.env.SENTRY_PROJECT || "doctor-bank-web";

export const isSentryConfigured = () => !!process.env.SENTRY_API_TOKEN;

// Only these values are ever forwarded to Sentry, so a crafted query string can't be used to build arbitrary requests.
// Each period maps to the chart bucket size.
export const PERIODS = {
  "1h": "5m",
  "24h": "1h",
  "7d": "6h",
  "14d": "1d",
  "30d": "1d",
} as const;
export type Period = keyof typeof PERIODS;

export const ISSUE_SORTS = ["date", "freq", "user"] as const;
export type IssueSort = (typeof ISSUE_SORTS)[number];

export const TX_SORTS = {
  count: "-count()",
  p95: "-p95(transaction.duration)",
  failure: "-failure_rate()",
} as const;
export type TxSort = keyof typeof TX_SORTS;

export class SentryApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const friendlyError = (status: number) => {
  if (status === 401) return "Sentry rejected the token (SENTRY_API_TOKEN is invalid or expired).";
  if (status === 403) return "The Sentry token is missing a permission. It needs org:read, project:read and event:read.";
  if (status === 404) return "Sentry could not find that organization or project. Check SENTRY_ORG and SENTRY_PROJECT.";
  if (status === 429) return "Sentry is rate limiting requests. Try again in a minute.";
  return `Sentry returned an error (${status}).`;
};

async function sentryGet<T>(path: string, params: [string, string][]): Promise<T> {
  const url = new URL(`${API_BASE}/api/0${path}`);
  for (const [key, value] of params) url.searchParams.append(key, value);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.SENTRY_API_TOKEN}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new SentryApiError(res.status, friendlyError(res.status));
  return (await res.json()) as T;
}

const projectQuery = `project:${SENTRY_PROJECT}`;

// ---------- Types sent to the UI ----------

export type SentryIssue = {
  id: string;
  shortId: string;
  title: string;
  culprit: string | null;
  level: string;
  status: string;
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
  isUnhandled: boolean;
};

export type SentryOverview = {
  transactions: number;
  p50: number | null;
  p95: number | null;
  failureRate: number | null;
  tpm: number | null;
  lcpP75: number | null;
};

export type SentryTransaction = {
  name: string;
  count: number;
  p50: number | null;
  p95: number | null;
  failureRate: number | null;
  tpm: number | null;
};

export type SeriesPoint = { t: number; count: number };

// ---------- Queries ----------

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

// Unresolved issues feed (errors grouped by Sentry)
export async function getIssues(period: Period, sort: IssueSort): Promise<SentryIssue[]> {
  const raw = await sentryGet<Record<string, unknown>[]>(`/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/issues/`, [
    ["query", "is:unresolved"],
    ["statsPeriod", period],
    ["sort", sort],
    ["limit", "25"],
  ]);

  return raw.map((i) => ({
    id: String(i.id),
    shortId: String(i.shortId ?? ""),
    title: String(i.title ?? "Unknown error"),
    culprit: typeof i.culprit === "string" ? i.culprit : null,
    level: String(i.level ?? "error"),
    status: String(i.status ?? "unresolved"),
    count: Number(i.count ?? 0),
    userCount: Number(i.userCount ?? 0),
    firstSeen: String(i.firstSeen ?? ""),
    lastSeen: String(i.lastSeen ?? ""),
    permalink: String(i.permalink ?? ""),
    isUnhandled: Boolean(i.isUnhandled),
  }));
}

// Headline performance numbers for the whole project
export async function getOverview(period: Period): Promise<SentryOverview> {
  const res = await sentryGet<{ data: Record<string, unknown>[] }>(`/organizations/${SENTRY_ORG}/events/`, [
    ["dataset", "transactions"],
    ["field", "count()"],
    ["field", "p50(transaction.duration)"],
    ["field", "p95(transaction.duration)"],
    ["field", "failure_rate()"],
    ["field", "tpm()"],
    ["field", "p75(measurements.lcp)"],
    ["query", `event.type:transaction ${projectQuery}`],
    ["statsPeriod", period],
    ["per_page", "1"],
  ]);

  const row = res.data?.[0] ?? {};
  return {
    transactions: num(row["count()"]) ?? 0,
    p50: num(row["p50(transaction.duration)"]),
    p95: num(row["p95(transaction.duration)"]),
    failureRate: num(row["failure_rate()"]),
    tpm: num(row["tpm()"]),
    lcpP75: num(row["p75(measurements.lcp)"]),
  };
}

// Per-page / per-route performance table
export async function getTopTransactions(period: Period, sort: TxSort): Promise<SentryTransaction[]> {
  const res = await sentryGet<{ data: Record<string, unknown>[] }>(`/organizations/${SENTRY_ORG}/events/`, [
    ["dataset", "transactions"],
    ["field", "transaction"],
    ["field", "count()"],
    ["field", "p50(transaction.duration)"],
    ["field", "p95(transaction.duration)"],
    ["field", "failure_rate()"],
    ["field", "tpm()"],
    ["query", `event.type:transaction ${projectQuery}`],
    ["statsPeriod", period],
    ["sort", TX_SORTS[sort]],
    ["per_page", "10"],
  ]);

  return (res.data ?? []).map((r) => ({
    name: String(r["transaction"] ?? "(unknown)"),
    count: num(r["count()"]) ?? 0,
    p50: num(r["p50(transaction.duration)"]),
    p95: num(r["p95(transaction.duration)"]),
    failureRate: num(r["failure_rate()"]),
    tpm: num(r["tpm()"]),
  }));
}

type StatsResponse = { data: [number, { count: number }[]][] };

async function getSeries(period: Period, dataset: "errors" | "transactions", eventType: string): Promise<SeriesPoint[]> {
  const res = await sentryGet<StatsResponse>(`/organizations/${SENTRY_ORG}/events-stats/`, [
    ["dataset", dataset],
    ["field", "count()"],
    ["query", `event.type:${eventType} ${projectQuery}`],
    ["statsPeriod", period],
    ["interval", PERIODS[period]],
  ]);
  return (res.data ?? []).map(([ts, vals]) => ({ t: ts * 1000, count: vals?.[0]?.count ?? 0 }));
}

export const getErrorSeries = (period: Period) => getSeries(period, "errors", "error");
export const getRequestSeries = (period: Period) => getSeries(period, "transactions", "transaction");