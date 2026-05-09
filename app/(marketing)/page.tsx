"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import ThemeToggle from "@/components/ThemeToggle";
import Hero from "@/components/Hero";
import Pricing from "@/components/Pricing";
import About from "@/components/About";
import Aurora from "@/components/Aurora";

export default function LandingPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevents hydration errors (React waiting for the browser to load)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 🌙 Dark Mode: Your Neon Blues
  const darkColors = ["#000dff", "#0400ff", "#0400ff"];
  
  // ☀️ Light Mode: Your Red Range
  const lightColors = ["#4c67ff", "#ffffff", "#c5c8ff"];

  return (
    <main className="min-h-screen relative flex flex-col items-center pt-40 pb-20 overflow-x-hidden" id="home">
      {mounted && (
        <Aurora
          // key forces the Aurora to restart with new colors immediately
          key={resolvedTheme} 
          colorStops={resolvedTheme === "light" ? lightColors : darkColors}
          blend={0.8}
          amplitude={0.8}
          speed={0.6}
        />
      )}
      
      <ThemeToggle />
      <TopNav />
      <Hero />
      <Pricing />
      <About />
    </main>
  );
}