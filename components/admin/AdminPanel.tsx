"use client";

import { useCallback, useEffect, useState } from "react";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  isAdmin: boolean;
  plan: string;
  planStatus: string;
  planRenewsAt: string | null;
  chatsStarted: number;
  suspended: boolean;
  createdAt: string;
  applicationsCount: number;
  paymentsCount: number;
};

type UserDetail = AdminUser & {
  isEnvAdmin: boolean;
  hasSubscription: boolean;
  payments: { id: string; amount: string; currency: string; status: string; createdAt: string }[];
  applications: { id: string; pdfName: string; createdAt: string }[];
};

type Stats = {
  totalUsers: number;
  newUsers7d: number;
  proUsers: number;
  freeUsers: number;
  suspendedUsers: number;
  totalChats: number;
  paidCheckouts: number;
};

type LogEntry = {
  id: string;
  adminEmail: string;
  action: string;
  targetEmail: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
};

const PAGE_SIZE = 15;
const fmtDate = (value: string | null) => (value ? new Date(value).toLocaleDateString("en-GB") : "-");
const isPro = (u: { plan: string; planStatus: string }) => u.plan === "PRO" && u.planStatus === "ACTIVE";

function Avatar({ user }: { user: { name: string | null; email: string | null; image: string | null } }) {
  return (
    <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-brand-primary text-white flex items-center justify-center font-bold">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt="" className="w-full h-full object-cover" />
      ) : (
        (user.name || user.email || "U").charAt(0).toUpperCase()
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#F0F2F0] rounded-3xl px-6 py-5">
      <p className="text-3xl font-black text-black">{value.toLocaleString()}</p>
      <p className="text-sm font-semibold text-gray-600 mt-1">{label}</p>
    </div>
  );
}

function PlanBadge({ user }: { user: { plan: string; planStatus: string } }) {
  const pro = isPro(user);
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        pro ? "bg-brand-primary text-white" : "bg-gray-200 text-gray-700"
      }`}
    >
      {pro ? "PRO" : "FREE"}
    </span>
  );
}

export default function AdminPanel({ currentAdminId }: { currentAdminId: string }) {
  const [tab, setTab] = useState<"users" | "activity">("users");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<UserDetail | null>(null);
  const [proDays, setProDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Wait for the admin to stop typing before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats", { cache: "no-store" });
    if (res.ok) setStats(await res.json());
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: query, plan: planFilter, page: String(page), pageSize: String(PAGE_SIZE) });
      const res = await fetch(`/api/admin/users?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load users");
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [query, planFilter, page]);

  const loadLogs = useCallback(async () => {
    const res = await fetch("/api/admin/logs", { cache: "no-store" });
    if (res.ok) setLogs((await res.json()).logs);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (tab === "activity") loadLogs();
  }, [tab, loadLogs]);

  const openUser = async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}`, { cache: "no-store" });
    if (res.ok) setSelected(await res.json());
  };

  const refreshAll = async (userId?: string) => {
    await Promise.all([loadUsers(), loadStats(), userId ? openUser(userId) : Promise.resolve()]);
  };

  const runAction = async (action: string, confirmText?: string) => {
    if (!selected) return;
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, days: proDays }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) alert(data.error || "Action failed");
      await refreshAll(selected.id);
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async () => {
    if (!selected) return;
    const warning = selected.hasSubscription
      ? "\n\nThis user has a PayHere subscription. Deleting the account does NOT stop their billing."
      : "";
    if (!confirm(`Permanently delete ${selected.email}? All their chats and payment records will be erased.${warning}`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${selected.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Delete failed");
      } else {
        setSelected(null);
        await Promise.all([loadUsers(), loadStats()]);
      }
    } finally {
      setBusy(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isSelf = selected?.id === currentAdminId;

  return (
    <div className="w-full max-w-[1300px] flex flex-col gap-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-4xl font-black text-black">Admin Panel</h1>
          <p className="text-gray-600 font-medium mt-1">Manage users, plans and activity.</p>
        </div>
        <div className="flex gap-2 rounded-full bg-[#F0F2F0] p-1">
          {(["users", "activity"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-6 py-2 text-sm font-bold capitalize transition-colors ${
                tab === t ? "bg-brand-primary text-white shadow-sm" : "text-gray-700 hover:text-black"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard label="Total users" value={stats.totalUsers} />
          <StatCard label="New (7 days)" value={stats.newUsers7d} />
          <StatCard label="PRO users" value={stats.proUsers} />
          <StatCard label="Free users" value={stats.freeUsers} />
          <StatCard label="Suspended" value={stats.suspendedUsers} />
          <StatCard label="Chats saved" value={stats.totalChats} />
          <StatCard label="Paid checkouts" value={stats.paidCheckouts} />
        </div>
      )}

      {tab === "users" ? (
        <div className="bg-[#F0F2F0] rounded-[40px] p-6 md:p-8 shadow-inner">
          {/* Search + filter */}
          <div className="flex flex-col md:flex-row gap-3 mb-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="flex-1 rounded-full bg-white px-6 py-3 text-black outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-full bg-white px-5 py-3 font-semibold text-black outline-none"
            >
              <option value="ALL">All users</option>
              <option value="PRO">PRO only</option>
              <option value="FREE">Free only</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 font-bold">
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Chats</th>
                  <th className="px-3 py-2">Saved</th>
                  <th className="px-3 py-2">Joined</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center font-medium text-gray-500">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center font-medium text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => openUser(u.id)}
                      className="cursor-pointer border-t border-gray-200 bg-white/0 transition-colors hover:bg-white"
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar user={u} />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-black">
                              {u.name || "No name"}
                              {u.isAdmin && (
                                <span className="ml-2 rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white">ADMIN</span>
                              )}
                            </p>
                            <p className="truncate text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <PlanBadge user={u} />
                      </td>
                      <td className="px-3 py-3 font-semibold text-black">{u.chatsStarted}</td>
                      <td className="px-3 py-3 font-semibold text-black">{u.applicationsCount}</td>
                      <td className="px-3 py-3 text-gray-600">{fmtDate(u.createdAt)}</td>
                      <td className="px-3 py-3">
                        {u.suspended ? (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">Suspended</span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Active</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-5 flex items-center justify-between px-2 text-sm font-semibold text-gray-600">
            <span>{total.toLocaleString()} users</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-full bg-white px-5 py-2 text-black disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-full bg-white px-5 py-2 text-black disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#F0F2F0] rounded-[40px] p-6 md:p-8 shadow-inner">
          <h2 className="text-2xl font-bold text-black mb-4 px-2">Recent admin activity</h2>
          {logs.length === 0 ? (
            <p className="px-2 py-8 text-center font-medium text-gray-500">No admin actions yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {logs.map((log) => (
                <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white px-5 py-3 text-sm">
                  <span className="text-black">
                    <b>{log.adminEmail}</b> ran <b>{log.action}</b>
                    {log.targetEmail ? (
                      <>
                        {" "}
                        on <b>{log.targetEmail}</b>
                      </>
                    ) : null}
                  </span>
                  <span className="text-gray-500">{new Date(log.createdAt).toLocaleString("en-GB")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* User detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar user={selected} />
                <div>
                  <h3 className="text-xl font-black text-black">{selected.name || "No name"}</h3>
                  <p className="text-gray-500">{selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-2xl font-bold text-gray-400 hover:text-black" aria-label="Close">
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-[#F0F2F0] p-4">
                <p className="text-gray-500 font-semibold">Plan</p>
                <p className="mt-1 flex items-center gap-2 font-bold text-black">
                  <PlanBadge user={selected} /> {selected.planStatus}
                </p>
                {selected.planRenewsAt && <p className="mt-1 text-gray-600">Renews {fmtDate(selected.planRenewsAt)}</p>}
              </div>
              <div className="rounded-2xl bg-[#F0F2F0] p-4">
                <p className="text-gray-500 font-semibold">Usage</p>
                <p className="mt-1 font-bold text-black">
                  {selected.chatsStarted} chats started, {selected.applicationsCount} saved
                </p>
                <p className="mt-1 text-gray-600">Joined {fmtDate(selected.createdAt)}</p>
              </div>
            </div>

            {selected.suspended && (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                This account is suspended. The user can&apos;t chat or start a payment.
              </p>
            )}

            {/* Actions */}
            <h4 className="mt-6 mb-2 text-sm font-black uppercase tracking-wide text-gray-500">Actions</h4>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-[#F0F2F0] pl-4 pr-1 py-1">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={proDays}
                  onChange={(e) => setProDays(Number(e.target.value))}
                  className="w-14 bg-transparent text-sm font-bold text-black outline-none"
                  aria-label="Days of PRO access"
                />
                <span className="text-sm font-semibold text-gray-600">days</span>
                <button
                  disabled={busy}
                  onClick={() => runAction("SET_PRO")}
                  className="rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  Grant PRO
                </button>
              </div>

              <button
                disabled={busy}
                onClick={() =>
                  runAction(
                    "SET_FREE",
                    selected.hasSubscription
                      ? `Set ${selected.email} to Free?\n\nThey have a PayHere subscription. This does NOT stop their billing, so stop it in PayHere too.`
                      : `Set ${selected.email} to Free?`
                  )
                }
                className="rounded-full bg-[#F0F2F0] px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
              >
                Set to Free
              </button>

              <button
                disabled={busy}
                onClick={() => runAction("RESET_CHATS", "Reset this user's free chat counter to 0?")}
                className="rounded-full bg-[#F0F2F0] px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
              >
                Reset chat counter
              </button>

              {selected.suspended ? (
                <button
                  disabled={busy}
                  onClick={() => runAction("UNSUSPEND")}
                  className="rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  Unsuspend
                </button>
              ) : (
                <button
                  disabled={busy || isSelf || selected.isAdmin}
                  onClick={() => runAction("SUSPEND", `Suspend ${selected.email}? They won't be able to chat or pay.`)}
                  className="rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                >
                  Suspend
                </button>
              )}

              {selected.isAdmin ? (
                <button
                  disabled={busy || isSelf || selected.isEnvAdmin}
                  onClick={() => runAction("REMOVE_ADMIN", `Remove admin access from ${selected.email}?`)}
                  className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                  title={selected.isEnvAdmin ? "Set in ADMIN_EMAILS" : undefined}
                >
                  Remove admin
                </button>
              ) : (
                <button
                  disabled={busy}
                  onClick={() => runAction("MAKE_ADMIN", `Give ${selected.email} full admin access?`)}
                  className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  Make admin
                </button>
              )}

              <button
                disabled={busy || isSelf || selected.isAdmin}
                onClick={deleteUser}
                className="rounded-full bg-[#FF0000] px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                Delete user
              </button>
            </div>

            {/* Payments */}
            <h4 className="mt-6 mb-2 text-sm font-black uppercase tracking-wide text-gray-500">
              Payments ({selected.paymentsCount})
            </h4>
            {selected.payments.length === 0 ? (
              <p className="text-sm text-gray-500">No payments yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {selected.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-2xl bg-[#F0F2F0] px-4 py-2 text-sm">
                    <span className="font-bold text-black">
                      {p.currency} {Number(p.amount).toLocaleString()}
                    </span>
                    <span className="font-semibold text-gray-600">{p.status}</span>
                    <span className="text-gray-500">{fmtDate(p.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Saved chats */}
            <h4 className="mt-6 mb-2 text-sm font-black uppercase tracking-wide text-gray-500">
              Saved applications ({selected.applicationsCount})
            </h4>
            {selected.applications.length === 0 ? (
              <p className="text-sm text-gray-500">No saved applications.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {selected.applications.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-2xl bg-[#F0F2F0] px-4 py-2 text-sm">
                    <span className="truncate font-bold text-black">{a.pdfName}</span>
                    <span className="text-gray-500">{fmtDate(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}