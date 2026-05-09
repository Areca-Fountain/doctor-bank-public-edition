// app/(marketing)/page.tsx
"use client";

import TopNav from "@/components/TopNav";
import ThemeToggle from "@/components/ThemeToggle";
import Hero from "@/components/Hero";
import Pricing from "@/components/Pricing";
import About from "@/components/About";
import Aurora from "@/components/Aurora";

export default function LandingPage() {
  return (
    <main className="min-h-screen relative flex flex-col items-center pt-40 pb-20 overflow-x-hidden" id="home">
      
{/* Brand-Matched Aurora Background */}
<Aurora
        colorStops={["#000dff", "#0400ff", "#0400ff"]} // Soft icy blues and grays
        blend={0.8}
        amplitude={0.8}
        speed={0.6}
      />
      
      <ThemeToggle />
      <TopNav />
      <Hero />
      <Pricing />
      <About />
    </main>
  );
}