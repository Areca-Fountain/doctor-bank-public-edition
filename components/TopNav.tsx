"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { usePlan } from "@/lib/usePlan";

interface NavItem {
  name: string;
  href: string;
}

interface TopNavProps {
  view?: "home" | "dashboard";
}

const homeNavItems: NavItem[] = [
  { name: "Home", href: "/" },
  { name: "Pricing", href: "/#pricing" },
  { name: "About Us", href: "/#about" },
  { name: "Academy", href: "/academy" },
];

const dashboardNavItems: NavItem[] = [
  { name: "Home", href: "/" },
  { name: "Go to Settings", href: "/settings" },
];

// Smoothly scroll to a section (or the top). Uses Lenis when the page has it, else the browser.
const scrollToTarget = (target: HTMLElement | null) => {
  const lenis = typeof window !== "undefined" ? window.__lenis : undefined;
  if (!target) {
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (lenis) lenis.scrollTo(target, { offset: -100, duration: 1.2 });
  else target.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function TopNav({ view = "home" }: TopNavProps) {
  const { data: session } = useSession();
  const { isPro } = usePlan();
  const pathname = usePathname();
  // Only admins get an extra "Admin" link (the server decides, see /api/admin/me)
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!session?.user) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    fetch("/api/admin/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setIsAdmin(!!data?.isAdmin);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session?.user?.email]);

  // Pro members have no pricing section, so that tab becomes "Benefits"
  const proHomeNavItems = homeNavItems.map((i) => (i.name === "Pricing" ? { name: "Benefits", href: "/#benefits" } : i));
  const baseNavItems = view === "dashboard" ? dashboardNavItems : isPro ? proHomeNavItems : homeNavItems;
  const currentNavItems: NavItem[] = isAdmin ? [...baseNavItems, { name: "Admin", href: "/admin" }] : baseNavItems;

  const [activeTab, setActiveTab] = useState(currentNavItems[0]?.name || "Home");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the phone menu when the page changes, on Escape, or when the window grows to desktop size
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    const mql = window.matchMedia("(min-width: 768px)");
    const onResize = () => mql.matches && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    mql.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      mql.removeEventListener("change", onResize);
    };
  }, [menuOpen]);

  useEffect(() => {
    setActiveTab(currentNavItems[0]?.name || "Home");
  }, [view]);

  // Highlight the tab of the section you are currently reading
  useEffect(() => {
    if (view !== "home" || pathname !== "/") return;

    const sections = currentNavItems
      .map((item) => ({ name: item.name, id: item.href.split("#")[1] }))
      .filter((s) => !!s.id);

    let ticking = false;
    const update = () => {
      ticking = false;
      let current = currentNavItems[0]?.name || "Home";
      for (const { name, id } of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) current = name;
      }
      setActiveTab(current);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, [view, pathname, isAdmin]);

  // On the landing page, links like /#pricing glide to the section instead of jumping
  const handleNavClick = (e: MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    setActiveTab(item.name);
    setMenuOpen(false);
    if (pathname !== "/") return; // other pages: let Next.js navigate normally

    if (item.href === "/") {
      e.preventDefault();
      scrollToTarget(null);
      window.history.replaceState(null, "", "/");
      return;
    }

    const id = item.href.split("#")[1];
    const el = id ? document.getElementById(id) : null;
    if (!el) return; // no such section on this page, fall back to normal link
    e.preventDefault();
    scrollToTarget(el);
    window.history.replaceState(null, "", `/#${id}`);
  };

  const initial = session?.user?.name?.charAt(0).toUpperCase() || "U";

  const avatar = session?.user ? (
    <Link
      href="/dashboard"
      title={session.user.name || "User Profile"}
      className="block group touch-target relative"
    >
      <div
        className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all shadow-md bg-brand-primary flex items-center justify-center text-white font-bold text-lg ${
          isPro
            ? "border-[#e8b923] shadow-[0_0_12px_rgba(232,185,35,0.7)]"
            : "border-gray-300 dark:border-white/80 group-hover:border-brand-primary"
        }`}
      >
        {session.user.image ? (
          <img src={session.user.image} alt={session.user.name || "User Avatar"} className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </div>
      {isPro && (
        <span className="pro-tag absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-px text-[9px] font-black leading-none tracking-wider border border-white/70">
          PRO
        </span>
      )}
    </Link>
  ) : (
    <Link
      href="/login"
      title="Sign in"
      aria-label="Sign in"
      className="w-10 h-10 rounded-full border-2 border-gray-400 dark:border-white/80 hover:border-brand-primary text-gray-700 dark:text-white hover:bg-brand-primary hover:text-white transition-all duration-200 shadow-sm group flex items-center justify-center touch-target"
    >
      <svg className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
      </svg>
    </Link>
  );

  return (
    <div className="fixed top-3 md:top-8 w-full z-50 flex justify-center px-3 md:px-4 pointer-events-none" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <nav
        onMouseLeave={() => setHoveredTab(null)}
        aria-label="Main"
        className="relative bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-full pl-3 pr-2 md:px-4 py-2 md:py-2.5 flex items-center justify-between w-full max-w-[900px] shadow-lg shadow-black/5 pointer-events-auto transition-all duration-300"
      >
        {/* ---------- Desktop / tablet (md and up): the full link capsule ---------- */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {currentNavItems.map((item) => {
            // Hover highlight only follows a real mouse; touch taps would leave it "stuck"
            const isHoveredOrActive = (hoveredTab || activeTab) === item.name;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHoveredTab(item.name)}
                className="relative px-4 lg:px-6 py-2.5 rounded-2xl text-sm lg:text-base font-semibold transition-colors duration-200 select-none cursor-pointer flex items-center justify-center"
              >
                {isHoveredOrActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute inset-0 bg-brand-primary rounded-2xl shadow-md"
                  />
                )}
                <span
                  className={`relative z-10 transition-colors duration-200 ${
                    isHoveredOrActive
                      ? "text-white font-bold"
                      : "text-gray-700 dark:text-white/80 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ---------- Phone (below md): brand + current page + menu button ---------- */}
        <Link href="/" className="md:hidden flex items-center gap-2 pl-1 font-black text-brand-primary dark:text-white select-none">
          <img src="/logo.svg" alt="" className="w-7 h-7 rounded-full bg-black p-0.5" />
          <span className="text-base">Doctor Bank</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-3 md:pr-1">
          {session?.user && (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="hidden md:block text-xs text-gray-600 hover:text-black dark:text-white/70 dark:hover:text-white transition-colors px-2 py-1 font-medium"
            >
              Sign Out
            </button>
          )}
          {avatar}

          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-gray-800 dark:text-white touch-target"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {/* Slide-down menu sheet (phones only) */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="md:hidden absolute left-0 right-0 top-full mt-2 rounded-3xl bg-white/95 dark:bg-black/90 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xl p-3 flex flex-col gap-1"
            >
              {currentNavItems.map((item) => {
                const active = activeTab === item.name;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`px-5 py-3.5 rounded-2xl text-base font-semibold select-none touch-target ${
                      active ? "bg-brand-primary text-white font-bold" : "text-gray-800 dark:text-white/90 active:bg-gray-100 dark:active:bg-white/10"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}

              <div className="mt-1 pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between px-3 pb-1">
                {pathname === "/" ? <ThemeToggle inline /> : <span />}
                {session?.user && (
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-sm font-semibold text-gray-700 dark:text-white/80 px-3 py-2 touch-target"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
}