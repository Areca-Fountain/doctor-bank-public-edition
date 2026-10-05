import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin";
import {
  ISSUE_SORTS,
  PERIODS,
  SENTRY_ORG,
  SENTRY_PROJECT,
  TX_SORTS,
  getErrorSeries,
  getIssues,
  getOverview,
  getRequestSeries,
  getTopTransactions,
  isSentryConfigured,
  type IssueSort,
  type Period,
  type TxSort,
} from "@/lib/sentry";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

const errorMessage = (reason: unknown) => (reason instanceof Error ? reason.message : "Could not load this section.");

export async function GET(req: Request) {
  // Same guard as every other admin route: logged in, not suspended, and an admin
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!isSentryConfigured()) {
    return NextResponse.json({ configured: false }, { headers: noStore });
  }

  // Validate against allow-lists, anything unexpected falls back to a safe default
  const params = new URL(req.url).searchParams;
  const periodParam = params.get("period") ?? "24h";
  const sortParam = params.get("sort") ?? "date";
  const txSortParam = params.get("txSort") ?? "count";

  const period: Period = periodParam in PERIODS ? (periodParam as Period) : "24h";
  const sort: IssueSort = (ISSUE_SORTS as readonly string[]).includes(sortParam) ? (sortParam as IssueSort) : "date";
  const txSort: TxSort = txSortParam in TX_SORTS ? (txSortParam as TxSort) : "count";

  // Each section loads on its own, so one failing Sentry call doesn't blank the whole page
  const [issues, overview, transactions, errorSeries, requestSeries] = await Promise.allSettled([
    getIssues(period, sort),
    getOverview(period),
    getTopTransactions(period, txSort),
    getErrorSeries(period),
    getRequestSeries(period),
  ]);

  const sectionErrors: Record<string, string> = {};
  const pick = <T,>(name: string, result: PromiseSettledResult<T>, fallback: T): T => {
    if (result.status === "fulfilled") return result.value;
    sectionErrors[name] = errorMessage(result.reason);
    return fallback;
  };

  const body = {
    configured: true,
    period,
    sort,
    txSort,
    fetchedAt: new Date().toISOString(),
    org: SENTRY_ORG,
    project: SENTRY_PROJECT,
    sentryUrl: `https://${SENTRY_ORG}.sentry.io/issues/`,
    issues: pick("issues", issues, []),
    overview: pick("overview", overview, null),
    transactions: pick("transactions", transactions, []),
    errorSeries: pick("errorSeries", errorSeries, []),
    requestSeries: pick("requestSeries", requestSeries, []),
    sectionErrors,
  };

  return NextResponse.json(body, { headers: noStore });
}