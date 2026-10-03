"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// A template is re-created on every page change, so this gives each page a soft fade-in.
// Only opacity is animated so fixed elements (nav, theme toggle) are never affected.
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}