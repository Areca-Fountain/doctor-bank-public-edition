"use client";

// components/Pricing.tsx
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Reveal from "./Reveal";

// Must match PAYHERE_PLAN_AMOUNT / PAYHERE_PLAN_CURRENCY on the server
const PRICE_LABEL = process.env.NEXT_PUBLIC_PLAN_PRICE_LABEL ?? "LKR 3,000";

export default function Pricing() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setError(null);

    if (!session?.user) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/payhere/checkout", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // PayHere checkout expects a normal HTML form POST
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.url;
      Object.entries(data.fields as Record<string, string>).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <section id="pricing" className="mt-20 md:mt-32 flex flex-col items-center w-full px-4 mb-20">
      <Reveal className="text-center max-w-xl">
        <h3 className="text-4xl md:text-5xl font-black text-black dark:text-white tracking-tight">
          Plans & Pricing
        </h3>
        <p className="text-gray-500 dark:text-gray-400 font-medium mt-3 text-sm md:text-base">
          Save Your Money & Time
        </p>
      </Reveal>

      <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 md:gap-8 mt-8 md:mt-12 w-full max-w-4xl">
        {/* Free Plan */}
        <Reveal className="w-full max-w-[320px] flex self-center md:self-auto">
        <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div>
            <div className="text-center">
              <h4 className="text-brand-primary dark:text-white font-bold text-xl">Free</h4>
              <div className="text-5xl font-black text-gray-900 dark:text-white mt-4">$0</div>
              <p className="text-xs text-gray-500 font-medium mt-2">For Personal Use</p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-3 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-brand-primary dark:text-white font-bold">✓</span>
                  Solve Your Quick Problems
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-primary dark:text-white font-bold">✓</span>
                  Limited Credits
                </li>
              </ul>
            </div>
          </div>

          <button className="mt-8 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 w-full py-3 rounded-full text-sm font-bold cursor-not-allowed">
            Current Plan
          </button>
        </div>
        </Reveal>

        {/* Full House Plan */}
        <Reveal className="w-full max-w-[320px] flex self-center md:self-auto" delay={0.15}>
        <div className="w-full bg-brand-primary/5 dark:bg-gray-900/90 border-2 border-brand-primary rounded-3xl p-8 flex flex-col justify-between shadow-xl hover:shadow-2xl relative overflow-hidden transform md:-translate-y-2 md:hover:-translate-y-3 transition-all duration-300">
          <div className="absolute top-0 left-0 w-full bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest py-1.5 text-center">
            Most Popular
          </div>

          <div className="pt-4">
            <div className="text-center">
              <h4 className="text-brand-primary dark:text-white font-bold text-xl">Full House</h4>
              <div className="text-4xl font-black text-brand-primary dark:text-white mt-4 flex items-baseline justify-center">
                {PRICE_LABEL}
                <span className="text-sm font-bold text-brand-primary dark:text-white ml-1">
                  /month
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-2">
                For Commercial Use
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-brand-primary/20 dark:border-gray-800">
              <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-3 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-brand-primary dark:text-white font-bold">✓</span>
                  Solve Your Quick Problems
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-primary dark:text-white font-bold">✓</span>
                  Unlimited AI Credits
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-primary dark:text-white font-bold">✓</span>
                  Priority Processing
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <motion.button
              whileHover={loading ? undefined : { scale: 1.03 }}
              whileTap={loading ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={handleUpgrade}
              disabled={loading}
              className="bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white w-full py-3 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-colors duration-200 cursor-pointer"
            >
              {loading ? "Redirecting to PayHere..." : "Get Advanced"}
            </motion.button>
            {error && (
              <p className="mt-3 text-xs text-red-600 dark:text-red-400 text-center font-medium">
                {error}
              </p>
            )}
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
}