"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SmoothScroll from "@/components/SmoothScroll";
import { headingsOf, hrefFor, pageBySlug, pages, sidebarGroups, topTabs, type Block } from "@/lib/academy";


/* ---------- search ---------- */

const blockText = (b: Block): string => {
  switch (b.type) {
    case "p":
    case "h3":
      return b.text;
    case "h2":
      return b.text;
    case "ul":
      return b.items.join(" ");
    case "steps":
      return b.items.map((s) => `${s.title} ${s.text}`).join(" ");
    case "callout":
      return `${b.title ?? ""} ${b.text}`;
    case "table":
      return [...b.head, ...b.rows.flat()].join(" ");
    case "cards":
      return b.items.map((c) => `${c.title} ${c.text}`).join(" ");
    default:
      return "";
  }
};
const clean = (s: string) => s.replace(/[*`]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

type Hit = { slug: string; title: string; heading?: string; id?: string };

function useSearchIndex() {
  return useMemo(
    () =>
      pages.map((p) => {
        const sections: { id?: string; heading?: string; text: string }[] = [{ text: p.description }];
        let current: { id?: string; heading?: string; text: string } = { text: "" };
        for (const b of p.blocks) {
          if (b.type === "h2") {
            sections.push(current);
            current = { id: b.id, heading: b.text, text: b.text };
          } else {
            current.text += " " + clean(blockText(b));
          }
        }
        sections.push(current);
        return { slug: p.slug, title: p.title, sections };
      }),
    []
  );
}

function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AnimatePresence>{open && <SearchPanel onClose={onClose} />}</AnimatePresence>;
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const index = useSearchIndex();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hits = useMemo<Hit[]>(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const out: Hit[] = [];
    for (const p of index) {
      const titleHit = words.every((w) => p.title.toLowerCase().includes(w));
      if (titleHit) out.push({ slug: p.slug, title: p.title });
      for (const s of p.sections) {
        if (s.heading && words.every((w) => (s.heading + " " + s.text).toLowerCase().includes(w))) {
          out.push({ slug: p.slug, title: p.title, heading: s.heading, id: s.id });
        }
      }
    }
    return out.slice(0, 8);
  }, [q, index]);

  return (
    <>
      {(
        <motion.div
          data-lenis-prevent
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search the Academy"
            initial={{ y: -12, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-black"
          >
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 dark:border-white/10">
              <SearchIcon />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && hits[0]) {
                    window.location.assign(hits[0].id ? `${hrefFor(hits[0].slug)}#${hits[0].id}` : hrefFor(hits[0].slug));
                  }
                }}
                placeholder="Search the Academy"
                aria-label="Search the Academy"
                className="w-full bg-transparent py-4 text-base text-black outline-none placeholder:text-gray-400 dark:text-white"
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {!q && <p className="px-4 py-6 text-sm text-gray-500">Try “download”, “free plan”, or “collateral”.</p>}
              {q && hits.length === 0 && (
                <p className="px-4 py-6 text-sm text-gray-500">No results for “{q}”. Try a shorter or different word.</p>
              )}
              {hits.map((h, i) => (
                <Link
                  key={`${h.slug}-${h.id ?? "page"}-${i}`}
                  href={h.id ? `${hrefFor(h.slug)}#${h.id}` : hrefFor(h.slug)}
                  onClick={onClose}
                  className="block rounded-2xl px-4 py-3 [@media(hover:hover)]:hover:bg-brand-primary/10 dark:[@media(hover:hover)]:hover:bg-white/10"
                >
                  <span className="block text-sm font-bold text-black dark:text-white">{h.heading ?? h.title}</span>
                  <span className="block text-xs text-gray-500">{h.heading ? h.title : "Page"}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden className="shrink-0 text-gray-500">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

/* ---------- sidebar ---------- */

function SidebarNav({ slug, onNavigate, pillId }: { slug: string; onNavigate?: () => void; pillId: string }) {
  return (
    <nav aria-label="Academy pages" className="space-y-7">
      {/* Top tabs repeat here so phones can reach them */}
      <div className="space-y-1 md:hidden">
        {topTabs.map((t) => (
          <SideLink key={t.slug} href={hrefFor(t.slug)} active={slug === t.slug} onClick={onNavigate} pillId={pillId}>
            {t.label}
          </SideLink>
        ))}
      </div>

      {sidebarGroups.map((g) => (
        <div key={g.title}>
          <p className="mb-2 px-3 text-sm font-black text-black dark:text-white">{g.title}</p>
          <div className="space-y-1">
            {g.slugs.map((s) => (
              <SideLink key={s} href={hrefFor(s)} active={slug === s} onClick={onNavigate} pillId={pillId}>
                {pageBySlug(s)?.title ?? s}
              </SideLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SideLink({
  href,
  active,
  onClick,
  pillId,
  children,
}: {
  href: string;
  active: boolean;
  onClick?: () => void;
  pillId: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative block rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-300 touch-target ${
        active
          ? "text-white"
          : "text-gray-700 [@media(hover:hover)]:hover:bg-brand-primary/10 dark:text-white/80 dark:[@media(hover:hover)]:hover:bg-white/10"
      }`}
    >
      {active && (
        <motion.span
          layoutId={pillId}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className="absolute inset-0 rounded-xl bg-brand-primary shadow-md"
        />
      )}
      <span className="relative z-10">{children}</span>
    </Link>
  );
}

/* ---------- on this page ---------- */

function Outline({ toc }: { toc: { id: string; text: string }[] }) {
  const [active, setActive] = useState(toc[0]?.id ?? "");

  useEffect(() => {
    if (!toc.length) return;
    const els = toc.map((t) => document.getElementById(t.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-90px 0px -65% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [toc]);

  if (!toc.length) return null;
  return (
    <motion.nav
      aria-label="On this page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="mb-3 text-sm font-black text-black dark:text-white">On this page</p>
      <ul className="space-y-1 border-l border-gray-200 dark:border-white/10">
        {toc.map((t) => (
          <li key={t.id}>
            <a
              href={`#${t.id}`}
              className={`-ml-px block border-l-2 py-1.5 pl-4 text-[13px] leading-5 transition-colors ${
                active === t.id
                  ? "border-brand-primary font-bold text-brand-primary dark:border-white dark:text-white"
                  : "border-transparent text-gray-600 [@media(hover:hover)]:hover:text-black dark:text-gray-400 dark:[@media(hover:hover)]:hover:text-white"
              }`}
            >
              {t.text}
            </a>
          </li>
        ))}
      </ul>
    </motion.nav>
  );
}

/* ---------- shell ---------- */

export default function AcademyShell({ children }: { children: ReactNode }) {
  

  const pathname = usePathname();
  const slug = pathname.replace(/^\/academy\/?/, "").split("/")[0];
  const current = pageBySlug(slug);
  const toc = current ? headingsOf(current) : [];

  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);

  // Ctrl/⌘ + K opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

 
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [drawer]);

  return (
    <div className="relative z-10 min-h-screen w-full">
      <SmoothScroll />
      {/* ---------- header ---------- */}
      <header
        className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-black/40"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-2 px-3 sm:gap-4 sm:px-6">
          <button
            onClick={() => setDrawer(true)}
            aria-label="Open Academy menu"
            aria-expanded={drawer}
            className="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-800 dark:text-white md:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <Link href="/academy" className="flex shrink-0 items-center gap-2 font-black text-brand-primary dark:text-white">
            <img src="/logo.svg" alt="" className="h-8 w-8 rounded-full bg-black p-0.5" />
            <span className="text-base sm:text-lg">
              Doctor Bank <span className="font-medium text-gray-500 dark:text-gray-400">Academy</span>
            </span>
          </Link>

          <nav aria-label="Academy sections" className="ml-2 hidden items-center gap-1 md:flex lg:ml-6">
            {topTabs.map((t) => {
              const active = t.slug === slug;
              return (
                <Link
                  key={t.slug}
                  href={hrefFor(t.slug)}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-2xl px-4 py-2 text-sm font-semibold transition-colors duration-300 lg:text-base ${
                    active
                      ? "font-bold text-white"
                      : "text-gray-700 [@media(hover:hover)]:hover:bg-brand-primary/10 dark:text-white/80 dark:[@media(hover:hover)]:hover:bg-white/10"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="academyTabPill"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded-2xl bg-brand-primary shadow-md"
                    />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSearch(true)}
              aria-label="Search the Academy"
              className="touch-target flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-3 text-sm text-gray-600 dark:border-white/15 dark:bg-white/5 dark:text-gray-300 sm:min-w-[170px]"
            >
              <SearchIcon />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hover-only ml-auto hidden rounded-md border border-gray-200 px-1.5 text-[11px] font-semibold text-gray-500 dark:border-white/20 lg:inline">Ctrl K</kbd>
            </button>
            <Link
              href="/"
              className="hidden rounded-full px-3 py-2 text-sm font-semibold text-gray-700 dark:text-white/80 lg:block"
            >
              Home
            </Link>
            <Link
              href="/chat"
              className="touch-target hidden items-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white shadow-md active:scale-95 dark:bg-white dark:text-brand-primary sm:flex"
            >
              Start
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- mobile drawer ---------- */}
      <AnimatePresence>
        {drawer && (
          <motion.div
            data-lenis-prevent
            className="fixed inset-0 z-[60] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Academy menu"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="absolute inset-y-0 left-0 flex w-[84%] max-w-[320px] flex-col bg-white p-4 shadow-2xl dark:bg-black"
              style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="font-black text-brand-primary dark:text-white">Academy</span>
                <button
                  onClick={() => setDrawer(false)}
                  aria-label="Close menu"
                  className="touch-target flex h-10 w-10 items-center justify-center rounded-full text-gray-800 dark:text-white"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain pb-6">
                <SidebarNav slug={slug} onNavigate={() => setDrawer(false)} pillId="academyDrawerPill" />
              </div>
              <div className="flex items-center border-t border-gray-200 pt-3 dark:border-white/10">
                <Link href="/" className="touch-target px-3 py-2 text-sm font-semibold text-gray-700 dark:text-white/80">
                  Back to home
                </Link>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- three columns ---------- */}
      <div className="mx-auto flex w-full max-w-[1400px] gap-0 px-3 sm:px-6">
        <aside data-lenis-prevent className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto overscroll-contain py-8 pr-4 md:block">
          <SidebarNav slug={slug} pillId="academySidePill" />
        </aside>

        <main className="min-w-0 flex-1 py-8 sm:py-10 md:border-l md:border-gray-200 md:pl-8 dark:md:border-white/10 xl:pr-8">
          <article className="mx-auto max-w-3xl rounded-3xl bg-white/75 p-5 dark:bg-black/60 sm:p-8 md:p-10">
            {children}
          </article>
        </main>

        <aside data-lenis-prevent className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 overflow-y-auto py-10 pl-4 xl:block">
          <Outline key={slug} toc={toc} />
        </aside>
      </div>

      <SearchDialog open={search} onClose={() => setSearch(false)} />
    </div>
  );
}