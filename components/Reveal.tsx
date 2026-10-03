"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** seconds to wait before the animation starts (use for staggering) */
  delay?: number;
  /** how far (px) the element travels upward while fading in */
  y?: number;
  /** false = animate again every time it scrolls into view */
  once?: boolean;
};

/** Fades and slides its children in when they scroll into view. */
export default function Reveal({ children, className, delay = 0, y = 32, once = true }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}