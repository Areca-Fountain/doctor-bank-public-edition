"use client";

import { useEffect } from "react";
import Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Gives the page smooth, inertia-style mouse-wheel scrolling.
 * Mount it only on pages that scroll as a whole (landing page).
 * Pages with their own inner scroll areas (chat, admin) should not use it.
 */
export default function SmoothScroll() {
  useEffect(() => {
    // Users who asked for reduced motion keep normal browser scrolling
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    window.__lenis = lenis;

    let rafId = requestAnimationFrame(function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return null;
}