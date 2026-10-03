"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin blue bar at the top of the screen showing how far the page is scrolled. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-1 origin-left bg-brand-primary z-[60]"
    />
  );
}