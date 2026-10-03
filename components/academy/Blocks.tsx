"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Block } from "@/lib/academy";


export function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) parts.push(text.slice(last, i));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-bold text-black dark:text-white">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else if (tok.startsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="rounded-md bg-brand-primary/10 px-1.5 py-0.5 font-mono text-[0.85em] font-semibold text-brand-primary dark:bg-white/10 dark:text-white break-words"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    } else {
      const [, label, href] = tok.match(/\[([^\]]+)\]\(([^)]+)\)/) ?? [];
      parts.push(
        <Link
          key={key++}
          href={href}
          className="font-semibold text-brand-primary underline underline-offset-4 dark:text-white"
        >
          {label}
        </Link>,
      );
    }
    last = i + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

const tones = {
  note: "border-brand-primary/30 bg-brand-primary/5 dark:border-white/20 dark:bg-white/5",
  tip: "border-brand-primary bg-white dark:border-white/60 dark:bg-black/40",
  warning:
    "border-amber-400/70 bg-amber-50 dark:border-amber-400/50 dark:bg-amber-400/10",
} as const;

const toneLabel = { note: "Note", tip: "Tip", warning: "Warning" } as const;

// Same curve and rise as the home-page hero
const EASE = [0.22, 1, 0.36, 1] as const;

export function Rise({
  index,
  startAt,
  className,
  children,
}: {
  index: number;
  startAt: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ go: false, delay: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const openedAt = performance.now();
    
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
       
        const firstScreen = performance.now() - openedAt < 400;
        setState({
          go: true,
          delay: firstScreen ? startAt + Math.min(index, 8) * 0.07 : 0,
        });
        io.disconnect();
      },
      { rootMargin: "0px 0px 20% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [index, startAt]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={state.go ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.55, ease: EASE, delay: state.delay }}
    >
      {children}
    </motion.div>
  );
}

export default function Blocks({
  blocks,
  startAt = 0.45,
}: {
  blocks: Block[];
  startAt?: number;
}) {
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => (
        <Rise
          key={i}
          index={i}
          startAt={startAt}
          className={
            b.type === "h2" ? "!mt-12" : b.type === "h3" ? "!mt-8" : undefined
          }
        >
          <BlockView b={b} />
        </Rise>
      ))}
    </div>
  );
}

function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case "p":
      return (
        <p className="text-[15px] leading-7 text-gray-700 dark:text-gray-300 sm:text-base sm:leading-8">
          <Inline text={b.text} />
        </p>
      );

    case "h2":
      return (
        <h2
          id={b.id}
          className="border-b border-gray-200 pb-3 text-2xl font-black tracking-tight text-black dark:border-white/10 dark:text-white sm:text-3xl"
        >
          {b.text}
        </h2>
      );

    case "h3":
      return (
        <h3 className="text-lg font-bold text-black dark:text-white">
          {b.text}
        </h3>
      );

    case "ul":
      return (
        <ul className="space-y-2.5 text-[15px] leading-7 text-gray-700 dark:text-gray-300 sm:text-base">
          {b.items.map((item, j) => (
            <li key={j} className="flex gap-3">
              <span
                aria-hidden
                className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary dark:bg-white"
              />
              <span>
                <Inline text={item} />
              </span>
            </li>
          ))}
        </ul>
      );

    case "steps":
      return (
        <ol className="space-y-0">
          {b.items.map((s, j) => (
            <li key={j} className="relative flex gap-4 pb-6 last:pb-0">
              {j < b.items.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[15px] top-9 bottom-0 w-px bg-brand-primary/25 dark:bg-white/20"
                />
              )}
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white shadow-md">
                {j + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="font-bold text-black dark:text-white">
                  {s.title}
                </p>
                <p className="mt-1 text-[15px] leading-7 text-gray-700 dark:text-gray-300">
                  <Inline text={s.text} />
                </p>
              </div>
            </li>
          ))}
        </ol>
      );

    case "callout":
      return (
        <aside
          className={`rounded-2xl border p-4 sm:p-5 ${tones[b.tone]}`}
          role="note"
        >
          <p className="text-sm font-bold text-black dark:text-white">
            {b.title ?? toneLabel[b.tone]}
          </p>
          <p className="mt-1 text-[15px] leading-7 text-gray-700 dark:text-gray-300">
            <Inline text={b.text} />
          </p>
        </aside>
      );

    case "table":
      return (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white/70 dark:border-white/10 dark:bg-black/30">
          <table className="w-full min-w-[460px] text-left text-sm">
            <thead>
              <tr className="bg-brand-primary/5 dark:bg-white/5">
                {b.head.map((h, j) => (
                  <th
                    key={j}
                    scope="col"
                    className="px-4 py-3 font-bold text-black dark:text-white"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {b.rows.map((row, j) => (
                <tr key={j}>
                  {row.map((cell, k) => (
                    <td
                      key={k}
                      className={`px-4 py-3 align-top leading-6 ${
                        k === 0
                          ? "font-semibold text-black dark:text-white"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <Inline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "code":
      return (
        <pre className="overflow-x-auto rounded-2xl bg-black p-4 text-sm leading-6 text-white shadow-md dark:border dark:border-white/10">
          <code className="font-mono">{b.code}</code>
        </pre>
      );

    case "cards":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {b.items.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-2xl border border-gray-200 bg-white/80 p-5 transition-colors [@media(hover:hover)]:hover:border-brand-primary dark:border-white/10 dark:bg-black/40 dark:[@media(hover:hover)]:hover:border-white/60"
            >
              <p className="font-bold text-brand-primary dark:text-white">
                {c.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                {c.text}
              </p>
            </Link>
          ))}
        </div>
      );

    case "cta":
      return (
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-black sm:flex-row sm:items-center">
          <p className="text-lg font-bold text-brand-primary dark:text-white">
            {b.text}
          </p>
          <Link
            href={b.href}
            className="touch-target rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-transform active:scale-95 dark:bg-white dark:text-brand-primary"
          >
            {b.label}
          </Link>
        </div>
      );
  }
}
