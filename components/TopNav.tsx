"use client";

import { signOut, useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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
  { name: "Academy", href: "/#academy" },
];

const dashboardNavItems: NavItem[] = [
  { name: "Home", href: "/" },
  { name: "Go to Setting", href: "/settings" },
];

export default function TopNav({ view = "home" }: TopNavProps) {
  const { data: session } = useSession();
  const currentNavItems = view === "dashboard" ? dashboardNavItems : homeNavItems;

  const [activeTab, setActiveTab] = useState(currentNavItems[0]?.name || "Home");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(currentNavItems[0]?.name || "Home");
  }, [view]);

  return (
    <div className="fixed top-8 w-full z-50 flex justify-center px-4 pointer-events-none">
      {/* Glassmorphism Floating Capsule Container */}
      <nav 
        onMouseLeave={() => setHoveredTab(null)}
        className="relative bg-white/70 dark:bg-black/40 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-full px-4 py-2.5 flex items-center justify-between w-full max-w-[900px] shadow-lg shadow-black/5 pointer-events-auto transition-all duration-300"
      >
        {/* Navigation Links with Moving Blue Box */}
        <div className="flex items-center gap-1 sm:gap-2">
          {currentNavItems.map((item) => {
            const isHoveredOrActive = (hoveredTab || activeTab) === item.name;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setActiveTab(item.name)}
                onMouseEnter={() => setHoveredTab(item.name)}
                className="relative px-6 py-2.5 rounded-2xl text-base font-semibold transition-colors duration-200 select-none cursor-pointer flex items-center justify-center"
              >
                {/* Sliding Blue Highlight Box */}
                {isHoveredOrActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                    className="absolute inset-0 bg-brand-primary rounded-2xl shadow-md"
                  />
                )}

                {/* Nav Link Text */}
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

        {/* Right Side: Google Profile Image & Sign-Out */}
        <div className="flex items-center gap-3 pr-1">
          {session?.user ? (
            <div className="flex items-center gap-3">
              {/* Sign Out Button */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="hidden sm:block text-xs text-gray-600 hover:text-black dark:text-white/70 dark:hover:text-white transition-colors px-2 py-1 font-medium"
              >
                Sign Out
              </button>

              {/* Profile Image Circle */}
              <Link
                href="/dashboard"
                title={session.user.name || "User Profile"}
                className="block group"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 dark:border-white/80 group-hover:border-brand-primary transition-all shadow-md bg-brand-primary flex items-center justify-center text-white font-bold text-lg">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    session.user.name?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
              </Link>
            </div>
          ) : (
            /* Circular Sign-In Button */
            <button
              onClick={() => signIn("google")}
              title="Sign in with Google"
              className="w-10 h-10 rounded-full border-2 border-gray-400 dark:border-white/80 hover:border-brand-primary text-gray-700 dark:text-white hover:bg-brand-primary hover:text-white transition-all duration-200 shadow-sm group flex items-center justify-center"
            >
              <svg className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
