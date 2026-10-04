"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react"; // Add this import
import { MotionConfig } from "framer-motion";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    // 1. Wrap everything in SessionProvider so useSession() works
    <SessionProvider>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="light" 
        enableSystem
      >
        {/* reducedMotion="user" turns off movement animations for people who set "reduce motion" in their OS */}
        <MotionConfig reducedMotion="user">
          {children}
        </MotionConfig>
      </ThemeProvider>
    </SessionProvider>
  );
}