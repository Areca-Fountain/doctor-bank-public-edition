"use client";

import { useEffect, useState } from "react";

export type InputMode = {
  /** viewport narrower than Tailwind's `md` (768px) */
  isMobile: boolean;
  /** primary pointer is a finger (touch screen) */
  isTouch: boolean;
  /** the device can really hover (mouse / trackpad) */
  canHover: boolean;
};

const QUERIES = {
  isMobile: "(max-width: 767px)",
  isTouch: "(pointer: coarse)",
  canHover: "(hover: hover)",
} as const;

/**
 * Tells components how the person is using the app: screen size AND input method.
 * Server render and first client render use desktop defaults, so there is no hydration mismatch.
 */
export function useInputMode(): InputMode {
  const [mode, setMode] = useState<InputMode>({ isMobile: false, isTouch: false, canHover: true });

  useEffect(() => {
    const lists = (Object.keys(QUERIES) as (keyof InputMode)[]).map((key) => [key, window.matchMedia(QUERIES[key])] as const);
    const read = () =>
      setMode(Object.fromEntries(lists.map(([key, mql]) => [key, mql.matches])) as InputMode);
    read();
    lists.forEach(([, mql]) => mql.addEventListener("change", read));
    return () => lists.forEach(([, mql]) => mql.removeEventListener("change", read));
  }, []);

  return mode;
}