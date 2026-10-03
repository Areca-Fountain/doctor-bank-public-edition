"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import Blocks, { Rise } from "./Blocks";
import { hrefFor, sidebarGroups, type AcademyPage } from "@/lib/academy";

type Neighbour = { slug: string; title: string } | null;

// rise and easing as the home-page hero 
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 36 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

/** The part of an Academy page that changes between topics */
export default function AcademyArticle({
  page,
  prev,
  next,
}: {
  page: AcademyPage;
  prev: Neighbour;
  next: Neighbour;
}) {
  const group = sidebarGroups.find((g) => g.slugs.includes(page.slug))?.title;

  return (
    <>
      <motion.header
        variants={container}
        initial="hidden"
        animate="show"
        className="mb-8"
      >
        {group && (
          <motion.p
            variants={item}
            className="mb-2 text-sm font-semibold text-brand-primary dark:text-gray-300"
          >
            {group}
          </motion.p>
        )}
        <motion.h1
          variants={item}
          className="text-3xl font-black tracking-tight text-brand-primary dark:text-white sm:text-5xl"
        >
          {page.title}
        </motion.h1>
        <motion.p
          variants={item}
          className="mt-4 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-400 sm:text-lg sm:leading-8"
        >
          {page.description}
        </motion.p>
      </motion.header>

      <Blocks blocks={page.blocks} />

      {(prev || next) && (
        <Rise index={99} startAt={0} className="mt-14">
          <nav
            aria-label="Previous and next pages"
            className="grid gap-4 border-t border-gray-200 pt-8 dark:border-white/10 sm:grid-cols-2"
          >
            {prev ? (
              <Link
                href={hrefFor(prev.slug)}
                className="rounded-2xl border border-gray-200 p-4 transition-colors [@media(hover:hover)]:hover:border-brand-primary dark:border-white/10 dark:[@media(hover:hover)]:hover:border-white/60"
              >
                <span className="block text-xs font-semibold text-gray-500">
                  Previous
                </span>
                <span className="mt-1 block font-bold text-brand-primary dark:text-white">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={hrefFor(next.slug)}
                className="rounded-2xl border border-gray-200 p-4 text-left transition-colors [@media(hover:hover)]:hover:border-brand-primary dark:border-white/10 dark:[@media(hover:hover)]:hover:border-white/60 sm:text-right"
              >
                <span className="block text-xs font-semibold text-gray-500">
                  Next
                </span>
                <span className="mt-1 block font-bold text-brand-primary dark:text-white">
                  {next.title}
                </span>
              </Link>
            )}
          </nav>
        </Rise>
      )}
    </>
  );
}
