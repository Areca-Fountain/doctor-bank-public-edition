"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Issue = {
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

type Overview = {
  transactions: number;
  p50: number | null;
  p95: number | null;
  failureRate: number | null;
  tpm: number | null;
  lcpP75: number | null;
};

type Transaction = {
  name: string;
  count: number;
  p50: number | null;
  p95: number | null;
  failureRate: number | null;
  tpm: number | null;
};

type SeriesPoint = { t: number; count: number };

type SentryData =
  | { configured: false }
  | {
      configured: true;
      period: string;
      fetchedAt: string;
      sentryUrl: string;
      issues: Issue[];
      overview: Overview | null;
      transactions: Transaction[];
      errorSeries: SeriesPoint[];
      requestSeries: SeriesPoint[];
      sectionErrors: Record<string, string>;
    };

const PERIOD_OPTIONS = [
  { value: "1h", label: "Last hour" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
  { value: "30d", label: "Last 30 days" },
];

const REFRESH_MS = 60_000;

// ---------- formatting helpers ----------

const fmtMs = (ms: number | null) => {
  if (ms === null) return "-";
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
};
const fmtPct = (v: number | null) => (v === null ? "-" : `${(v * 100).toFixed(v > 0 && v < 0.001 ? 2 : 1)}%`);
const fmtNum = (v: number | null, digits = 0) => (v === null ? "-" : v.toLocaleString(undefined, { maximumFractionDigits: digits }));

const timeAgo = (iso: string) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const levelStyle = (level: string) => {
  switch (level) {
    case "fatal":
    case "error":
      return "bg-red-100 text-red-700";
    case "warning":
      return "bg-amber-100 text-amber-700";
    case "info":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-200 text-gray-700";
  }
};

// Sentry only returns https permalinks, but never put anything else in an href
const safeHref = (url: string) => (url.startsWith("https://") ? url : undefined);

// ---------- small UI pieces ----------

function MetricCard({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "bad" | "ok" }) {
  return (
    <div className="bg-white rounded-3xl px-5 py-4">
      <p className={`text-2xl md:text-3xl font-black ${tone === "bad" ? "text-red-600" : "text-black"}`}>{value}</p>
      <p className="text-sm font-semibold text-gray-600 mt-1">{label}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function BarChart({ title, points, color, period }: { title: string; points: SeriesPoint[]; color: string; period: string }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const total = points.reduce((sum, p) => sum + p.count, 0);
  const showTime = period === "1h" || period === "24h";

  return (
    <div className="bg-white rounded-3xl p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-wide text-gray-500">{title}</h3>
        <span className="text-sm font-bold text-black">{total.toLocaleString()}</span>
      </div>
      {points.length === 0 ? (
        <p className="py-10 text-center text-sm font-medium text-gray-400">No data for this period.</p>
      ) : (
        <div className="mt-4 flex h-32 items-end gap-[2px]">
          {points.map((p) => {
            const label = new Date(p.t).toLocaleString("en-GB", showTime ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" });
            return (
              <div
                key={p.t}
                title={`${label}: ${p.count.toLocaleString()}`}
                className="flex-1 rounded-t-sm min-h-[2px]"
                style={{ height: `${Math.max(2, (p.count / max) * 100)}%`, backgroundColor: color, opacity: p.count === 0 ? 0.2 : 1 }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{message}</p>;
}

// ---------- main component ----------

export default function SentryPanel() {
  const [period, setPeriod] = useState("24h");
  const [sort, setSort] = useState("date");
  const [txSort, setTxSort] = useState("count");
  const [data, setData] = useState<SentryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ignore slow responses that arrive after a newer request was made
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period, sort, txSort });
      const res = await fetch(`/api/admin/sentry?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error(res.status === 403 ? "You no longer have admin access." : "Could not load Sentry data.");
      const json = (await res.json()) as SentryData;
      if (id === requestId.current) setData(json);
    } catch (err) {
      if (id === requestId.current) setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [period, sort, txSort]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh every minute while this tab is open and the browser tab is visible
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (!data && loading) {
    return <div className="bg-[#F0F2F0] rounded-3xl md:rounded-[40px] p-8 text-center font-medium text-gray-500">Loading Sentry data...</div>;
  }

  if (!data) {
    return (
      <div className="bg-[#F0F2F0] rounded-3xl md:rounded-[40px] p-8 text-center">
        <p className="font-semibold text-red-600">{error ?? "Could not load Sentry data."}</p>
        <button onClick={load} className="mt-4 rounded-full bg-brand-primary px-6 py-2.5 text-sm font-bold text-white">
          Try again
        </button>
      </div>
    );
  }

  if (!data.configured) {
    return (
      <div className="bg-[#F0F2F0] rounded-3xl md:rounded-[40px] p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-black">Connect Sentry</h2>
        <p className="mt-2 text-gray-600 font-medium">
          Sentry is collecting data, but this dashboard has no token to read it yet. Add these to your environment variables and redeploy:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-white p-4 text-sm text-black">
{`SENTRY_API_TOKEN=sntrys_...   # read-only token (see setup guide)
SENTRY_ORG=areca-3n           # optional, this is the default
SENTRY_PROJECT=doctor-bank-web # optional, this is the default`}
        </pre>
      </div>
    );
  }

  const { overview, issues, transactions, sectionErrors } = data;
  const errorTotal = data.errorSeries.reduce((sum, p) => sum + p.count, 0);
  const highFailure = (overview?.failureRate ?? 0) > 0.05;

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-2">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-full bg-[#F0F2F0] px-5 py-2.5 text-sm font-semibold text-black outline-none"
            aria-label="Time range"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-full bg-[#F0F2F0] px-5 py-2.5 text-sm font-bold text-black disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <span className="text-xs font-medium text-gray-400">Updated {timeAgo(data.fetchedAt)} · auto-refreshes every minute</span>
        </div>
        {safeHref(data.sentryUrl) && (
          <a
            href={data.sentryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-black px-5 py-2.5 text-center text-sm font-bold text-white"
          >
            Open in Sentry
          </a>
        )}
      </div>

      {error && <p className="px-2 text-sm font-semibold text-red-600">{error} Showing the last data we have.</p>}

      {/* Performance overview */}
      <div className="bg-[#F0F2F0] rounded-3xl md:rounded-[40px] p-4 md:p-8 shadow-inner">
        <h2 className="text-xl md:text-2xl font-bold text-black mb-4 px-2">Performance</h2>
        <SectionError message={sectionErrors.overview} />
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            <MetricCard label="Errors" value={errorTotal.toLocaleString()} tone={errorTotal > 0 ? "bad" : "ok"} />
            <MetricCard label="Requests traced" value={overview.transactions.toLocaleString()} hint={`${fmtNum(overview.tpm, 1)} / min`} />
            <MetricCard label="Median response" value={fmtMs(overview.p50)} hint="p50" />
            <MetricCard label="Slow responses" value={fmtMs(overview.p95)} hint="p95" />
            <MetricCard label="Failure rate" value={fmtPct(overview.failureRate)} tone={highFailure ? "bad" : "ok"} />
            <MetricCard label="Page load (LCP)" value={fmtMs(overview.lcpP75)} hint="p75, real users" />
          </div>
        )}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          <BarChart title="Errors over time" points={data.errorSeries} color="#DC2626" period={data.period} />
          <BarChart title="Requests over time" points={data.requestSeries} color="#16A34A" period={data.period} />
        </div>
        <SectionError message={sectionErrors.errorSeries || sectionErrors.requestSeries} />
      </div>

      {/* Issues feed */}
      <div className="bg-[#F0F2F0] rounded-3xl md:rounded-[40px] p-4 md:p-8 shadow-inner">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
          <h2 className="text-xl md:text-2xl font-bold text-black">Error feed</h2>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black outline-none"
            aria-label="Sort errors"
          >
            <option value="date">Most recent</option>
            <option value="freq">Most frequent</option>
            <option value="user">Most users affected</option>
          </select>
        </div>
        <SectionError message={sectionErrors.issues} />
        {issues.length === 0 && !sectionErrors.issues ? (
          <p className="px-2 py-8 text-center font-medium text-gray-500">No unresolved errors. 🎉</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {issues.map((issue) => {
              const href = safeHref(issue.permalink);
              const body = (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${levelStyle(issue.level)}`}>{issue.level}</span>
                      {issue.isUnhandled && <span className="rounded-full bg-black px-2.5 py-0.5 text-[11px] font-bold text-white">UNHANDLED</span>}
                      <span className="text-xs font-semibold text-gray-400">{issue.shortId}</span>
                    </div>
                    <p className="mt-1 break-words font-bold text-black">{issue.title}</p>
                    {issue.culprit && <p className="truncate text-sm text-gray-500">{issue.culprit}</p>}
                  </div>
                  <div className="flex shrink-0 gap-5 text-sm sm:text-right">
                    <div>
                      <p className="font-black text-black">{issue.count.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">events</p>
                    </div>
                    <div>
                      <p className="font-black text-black">{issue.userCount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">users</p>
                    </div>
                    <div className="min-w-[64px]">
                      <p className="font-bold text-black">{timeAgo(issue.lastSeen)}</p>
                      <p className="text-xs text-gray-500">last seen</p>
                    </div>
                  </div>
                </>
              );
              const cls = "flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl bg-white px-5 py-4";
              return (
                <li key={issue.id}>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} transition-shadow [@media(hover:hover)]:hover:shadow-md`}>
                      {body}
                    </a>
                  ) : (
                    <div className={cls}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Slowest / busiest pages */}
      <div className="bg-[#F0F2F0] rounded-3xl md:rounded-[40px] p-4 md:p-8 shadow-inner">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
          <h2 className="text-xl md:text-2xl font-bold text-black">Pages and API routes</h2>
          <select
            value={txSort}
            onChange={(e) => setTxSort(e.target.value)}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black outline-none"
            aria-label="Sort transactions"
          >
            <option value="count">Busiest</option>
            <option value="p95">Slowest (p95)</option>
            <option value="failure">Highest failure rate</option>
          </select>
        </div>
        <SectionError message={sectionErrors.transactions} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-500 font-bold">
                <th className="px-3 py-2">Route</th>
                <th className="px-3 py-2">Requests</th>
                <th className="hidden md:table-cell px-3 py-2">Per min</th>
                <th className="px-3 py-2">p50</th>
                <th className="px-3 py-2">p95</th>
                <th className="px-3 py-2">Failures</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center font-medium text-gray-500">
                    No performance data for this period.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.name} className="border-t border-gray-200">
                    <td className="max-w-[260px] truncate px-3 py-3 font-bold text-black" title={t.name}>
                      {t.name}
                    </td>
                    <td className="px-3 py-3 font-semibold text-black">{t.count.toLocaleString()}</td>
                    <td className="hidden md:table-cell px-3 py-3 text-gray-600">{fmtNum(t.tpm, 2)}</td>
                    <td className="px-3 py-3 text-gray-600">{fmtMs(t.p50)}</td>
                    <td className={`px-3 py-3 font-semibold ${(t.p95 ?? 0) > 3000 ? "text-red-600" : "text-black"}`}>{fmtMs(t.p95)}</td>
                    <td className={`px-3 py-3 font-semibold ${(t.failureRate ?? 0) > 0.05 ? "text-red-600" : "text-gray-600"}`}>{fmtPct(t.failureRate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}