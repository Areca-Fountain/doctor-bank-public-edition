"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react"; // Add this import
import { MotionConfig } from "framer-motion";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    // 1. Wrap everything in SessionProvider so useSession() works
    <SessionProvider>
      {/* Dark is the default for everyone. The theme can only be changed from Settings → Appearance.
          enableSystem is off so the visitor's OS setting never overrides the dark default.
          A new storageKey means choices saved by the old toggle (key "theme") are ignored,
          so every visitor starts on dark until they pick something in Settings. */}
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        storageKey="doctorbank-theme"
        disableTransitionOnChange
      >
        {/* reducedMotion="user" turns off movement animations for people who set "reduce motion" in their OS */}
        <MotionConfig reducedMotion="user">
          {children}
        </MotionConfig>
      </ThemeProvider>
    </SessionProvider>
  );
}