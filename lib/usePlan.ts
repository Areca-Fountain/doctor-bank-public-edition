"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Tells any component whether the signed-in user is on the Pro (Full House) plan.
// The server (/api/usage) is the source of truth; the browser only displays the result.
// loading = true until we know, so the page never flashes the wrong version.
export function usePlan() {
  const { data: session, status } = useSession();
  const [isPro, setIsPro] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      setIsPro(false);
      setChecked(true);
      return;
    }
    let cancelled = false;
    fetch("/api/usage", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setIsPro(data?.plan === "PRO");
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.email]);

  return { isPro, loading: status === "loading" || !checked };
}