"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react"; // Add this import
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
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}