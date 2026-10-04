"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import TopNav from "@/components/TopNav";
import SmoothScroll from "@/components/SmoothScroll";

type Account = {
  name: string | null;
  email: string;
  image: string | null;
  memberSince: string;
  plan: "FREE" | "PRO";
  planStatus: string;
  renewsAt: string | null;
  paidPlanActive: boolean;
  chatsUsed: number;
  chatsLimit: number;
  messagesLimit: number;
  savedChats: number;
};

type ModelInfo = { id: string; name: string; model: string; description: string; available: boolean };

// The chat page keeps the user's pick under this same key, so Settings and the chat dropdown stay in sync
const MODEL_KEY = "doctorbank.model";

// Same stagger, rise and easing as the home-page hero
const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const card = "rounded-3xl border border-gray-100 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-black sm:p-8";
const primaryBtn =
  "touch-target inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-brand-primary";
const ghostBtn =
  "touch-target inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-800 transition-colors active:scale-95 [@media(hover:hover)]:hover:border-brand-primary dark:border-white/25 dark:text-white dark:[@media(hover:hover)]:hover:border-white";

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

const STATUS_TEXT: Record<string, string> = {
  ACTIVE: "Active",
  PAST_DUE: "Payment overdue",
  CANCELLED: "Cancelled",
  CHARGEDBACK: "Ended after a chargeback",
  NONE: "No subscription",
};

function SectionTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="mb-5">
      <h2 className="text-xl font-black tracking-tight text-brand-primary dark:text-white sm:text-2xl">{title}</h2>
      {children && <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">{children}</p>}
    </header>
  );
}

function Avatar({ image, name, size }: { image: string | null; name: string | null; size: number }) {
  const initial = name?.charAt(0).toUpperCase() || "U";
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" width={size} height={size} referrerPolicy="no-referrer" className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className="flex items-center justify-center rounded-full bg-brand-primary font-bold text-white"
      style={{ width: size, height: size, fontSize: size / 2.4 }}
    >
      {initial}
    </span>
  );
}

export default function SettingsView() {
  const { data: session, status } = useSession();
  const [account, setAccount] = useState<Account | null>(null);
  const [loadError, setLoadError] = useState("");

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [model, setModel] = useState<string>("");
  const [modelMsg, setModelMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    Promise.all([fetch("/api/settings/account", { cache: "no-store" }), fetch("/api/settings/model", { cache: "no-store" })])
      .then(async ([a, m]) => {
        if (!a.ok) throw new Error();
        const acc = (await a.json()) as Account;
        const list = m.ok ? (((await m.json()).models as ModelInfo[]) ?? []) : [];
        const usable = list.filter((x) => x.available);
        let saved: string | null = null;
        try {
          saved = localStorage.getItem(MODEL_KEY);
        } catch {
          /* storage blocked */
        }
        // Same rule as the chat page: the saved pick if it still works, otherwise the first model that is on
        const selected = usable.find((x) => x.id === saved)?.id ?? usable[0]?.id ?? "";
        if (cancelled) return;
        setAccount(acc);
        setModels(list);
        setModel(selected);
        setModelsLoaded(true);
        setLoadError("");
      })
      .catch(() => {
        if (!cancelled) setLoadError("We couldn't load your settings. Refresh the page to try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const chooseModel = (id: string) => {
    const info = models.find((m) => m.id === id);
    if (!info || !info.available || id === model) return;
    setModel(id);
    try {
      localStorage.setItem(MODEL_KEY, id);
      setModelMsg({ ok: true, text: `Saved. ${info.name} will answer your next messages.` });
    } catch {
      setModelMsg({ ok: false, text: "Your browser blocked saving this choice, so it will reset when you leave the page." });
    }
  };

  const isPro = account?.plan === "PRO";
  const shownName = account?.name ?? session?.user?.name ?? null;
  const shownEmail = account?.email ?? session?.user?.email ?? "";
  const shownImage = account?.image ?? session?.user?.image ?? null;
  const renews = fmtDate(account?.renewsAt ?? null);

  return (
    <div className="flex min-h-dvh flex-col items-center px-3 pb-16 pt-24 sm:px-6 md:px-8 md:pt-28">
      <SmoothScroll />
      <TopNav view="dashboard" />

      <div className="w-full max-w-[1100px]">
        <motion.div variants={container} initial="hidden" animate="show" className="mb-8">
          <motion.h1 variants={rise} className="text-4xl font-black tracking-tight text-brand-primary dark:text-white sm:text-5xl">
            Settings
          </motion.h1>
          <motion.p variants={rise} className="mt-3 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-400 sm:text-lg">
            Manage your account, your plan, the AI model and your security.
          </motion.p>
        </motion.div>

        {loadError && (
          <p role="alert" className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-200">
            {loadError}
          </p>
        )}

        <motion.div variants={container} initial="hidden" animate="show" className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          {/* ---------- right column: who is signed in (first on phones) ---------- */}
          <motion.aside variants={rise} aria-label="Signed in account" className="order-first lg:sticky lg:top-28 lg:order-last">
            <div className={card}>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Signed in as</p>
              <div className="mt-4 flex items-center gap-4">
                <Avatar image={shownImage} name={shownName} size={56} />
                <div className="min-w-0">
                  <p className="truncate font-bold text-black dark:text-white">{shownName || "Doctor Bank user"}</p>
                  <span className="mt-1 inline-block rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-xs font-bold text-brand-primary dark:bg-white/10 dark:text-white">
                    {account ? (isPro ? "Full House" : "Free plan") : "Loading"}
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Google account</p>
                <p className="mt-1 break-all text-sm font-bold text-black dark:text-white" data-testid="signed-in-email">
                  {shownEmail || "…"}
                </p>
              </div>

              {account && (
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500 dark:text-gray-400">Member since</dt>
                    <dd className="font-semibold text-black dark:text-white">{fmtDate(account.memberSince)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500 dark:text-gray-400">Saved chats</dt>
                    <dd className="font-semibold text-black dark:text-white">{account.savedChats}</dd>
                  </div>
                </dl>
              )}

              <button onClick={() => signOut({ callbackUrl: "/" })} className={`${ghostBtn} mt-6 w-full`}>
                Sign out
              </button>
            </div>
          </motion.aside>

          {/* ---------- main column ---------- */}
          <div className="min-w-0 space-y-6">
            {/* Subscription */}
            <motion.section variants={rise} id="subscription" className={card} aria-labelledby="sub-h">
              <div id="sub-h">
                <SectionTitle title="Subscription">Your current plan and how much of it you have used.</SectionTitle>
              </div>

              {!account ? (
                <p className="text-sm text-gray-500">Loading your plan…</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                        isPro ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white"
                      }`}
                    >
                      {isPro ? "Full House · Paid" : "Free"}
                    </span>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {account.plan === "PRO" || account.planStatus !== "NONE"
                        ? STATUS_TEXT[account.planStatus] ?? account.planStatus
                        : "No subscription"}
                    </span>
                  </div>

                  {isPro ? (
                    <div className="mt-5 space-y-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
                      <p>Unlimited chats and messages, with priority processing.</p>
                      {renews && (
                        <p>
                          Next renewal: <strong className="text-black dark:text-white">{renews}</strong>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      <div>
                        <div className="flex justify-between text-sm font-semibold text-gray-700 dark:text-gray-300">
                          <span>Chats used</span>
                          <span>
                            {Math.min(account.chatsUsed, account.chatsLimit)} of {account.chatsLimit}
                          </span>
                        </div>
                        <div
                          className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
                          role="progressbar"
                          aria-label="Free chats used"
                          aria-valuemin={0}
                          aria-valuemax={account.chatsLimit}
                          aria-valuenow={Math.min(account.chatsUsed, account.chatsLimit)}
                        >
                          <div
                            className="h-full rounded-full bg-brand-primary transition-[width] duration-700 dark:bg-white"
                            style={{ width: `${Math.min(100, (account.chatsUsed / account.chatsLimit) * 100)}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Each Free chat can have up to {account.messagesLimit} messages.
                        </p>
                      </div>
                      {account.planStatus === "PAST_DUE" && (
                        <p className="rounded-2xl border border-amber-400/60 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-100">
                          Your last payment didn&apos;t go through. Pay again to get Full House back.
                        </p>
                      )}
                      <Link href="/#pricing" className={primaryBtn}>
                        Upgrade to Full House
                      </Link>
                    </div>
                  )}
                </>
              )}
            </motion.section>

            {/* AI model */}
            <motion.section variants={rise} id="ai-model" className={card} aria-labelledby="model-h">
              <div id="model-h">
                <SectionTitle title="AI model">Choose which AI answers your questions and fills in your forms.</SectionTitle>
              </div>

              {!modelsLoaded ? (
                <p className="text-sm text-gray-500">Loading models…</p>
              ) : models.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">No AI models are available right now. Please try again later.</p>
              ) : (
                <div role="radiogroup" aria-label="AI model" className="grid gap-3">
                  {models.map((opt) => {
                    const selected = model === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={!opt.available}
                        onClick={() => chooseModel(opt.id)}
                        className={`touch-target flex items-start gap-4 rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed ${
                          selected
                            ? "border-brand-primary bg-brand-primary/5 dark:border-white dark:bg-white/10"
                            : "border-gray-200 dark:border-white/15 " +
                              (!opt.available ? "opacity-60" : "[@media(hover:hover)]:hover:border-brand-primary dark:[@media(hover:hover)]:hover:border-white/60")
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            selected ? "border-brand-primary dark:border-white" : "border-gray-300 dark:border-white/40"
                          }`}
                        >
                          {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand-primary dark:bg-white" />}
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-black dark:text-white">{opt.name}</span>
                            <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-brand-primary dark:bg-white/10 dark:text-white">
                              {opt.model}
                            </span>
                            {!opt.available && (
                              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-bold text-gray-700 dark:bg-white/15 dark:text-gray-200">
                                Not available right now
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-sm leading-6 text-gray-600 dark:text-gray-400">{opt.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <p
                role="status"
                aria-live="polite"
                className={`mt-4 min-h-5 text-sm font-semibold ${modelMsg?.ok ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-300"}`}
              >
                {modelMsg?.text}
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                Your choice is remembered on this browser. You can also switch models from the dropdown next to the message box in the
                chat.
              </p>
            </motion.section>

            {/* Password */}
            <motion.section variants={rise} id="password" className={card} aria-labelledby="pw-h">
              <div id="pw-h">
                <SectionTitle title="Password and security" />
              </div>
              <p className="text-sm leading-7 text-gray-700 dark:text-gray-300">
                Doctor Bank doesn&apos;t keep a password of its own. You sign in with your Google account, so your password is
                managed by Google. To change it, use your Google account page.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="https://myaccount.google.com/signinoptions/password"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={primaryBtn}
                >
                  Change Google password
                </a>
                <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className={ghostBtn}>
                  Review account security
                </a>
              </div>
              <p className="mt-4 text-xs leading-5 text-gray-500 dark:text-gray-400">
                After changing your password, sign out here and sign back in so this device starts a fresh session.
              </p>
              <button onClick={() => signOut({ callbackUrl: "/" })} className={`${ghostBtn} mt-3`}>
                Sign out of this device
              </button>
            </motion.section>

            {/* Delete */}
            <motion.section
              variants={rise}
              id="delete-profile"
              className="rounded-3xl border border-red-300 bg-white p-6 shadow-xl dark:border-red-400/40 dark:bg-black sm:p-8"
              aria-labelledby="del-h"
            >
              <div id="del-h">
                <SectionTitle title="Delete profile" />
              </div>
              <p className="text-sm leading-7 text-gray-700 dark:text-gray-300">
                This permanently removes your profile, your saved chats and PDFs, and your payment records from Doctor Bank. It can&apos;t
                be undone.
              </p>
              {account?.paidPlanActive && (
                <p className="mt-4 rounded-2xl border border-amber-400/60 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-100">
                  You have an active Full House subscription. Cancel it with PayHere (or ask support) first, so you aren&apos;t charged again.
                </p>
              )}
              <button
                onClick={() => setDeleteOpen(true)}
                disabled={!account || account.paidPlanActive}
                className="touch-target mt-5 inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete my profile
              </button>
            </motion.section>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {deleteOpen && account && <DeleteDialog email={account.email} onClose={() => setDeleteOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function DeleteDialog({ email, onClose }: { email: string; onClose: () => void }) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const confirmDelete = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/settings/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: typed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete your profile.");
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete your profile.");
      setBusy(false);
    }
  };

  return (
    <motion.div
      data-lenis-prevent
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-black sm:p-8"
      >
        <h2 id="delete-title" className="text-xl font-black text-black dark:text-white">
          Delete your profile?
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
          Everything linked to <strong className="break-all text-black dark:text-white">{email}</strong> will be deleted for good. To
          confirm, type your email below.
        </p>
        <input
          autoFocus
          type="email"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={email}
          aria-label="Type your email to confirm"
          disabled={busy}
          className="mt-5 w-full rounded-2xl border border-gray-300 bg-transparent px-4 py-3 text-sm text-black outline-none focus:border-red-500 dark:border-white/25 dark:text-white"
        />
        <p role="alert" className="mt-3 min-h-5 text-sm font-semibold text-red-700 dark:text-red-300">
          {error}
        </p>
        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button onClick={onClose} disabled={busy} className={ghostBtn}>
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            disabled={!matches || busy}
            className="touch-target inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Deleting…" : "Delete forever"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
