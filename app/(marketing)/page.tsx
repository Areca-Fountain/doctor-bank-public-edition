import TopNav from "@/components/TopNav";
import ThemeToggle from "@/components/ThemeToggle";
import Hero from "@/components/Hero";
import Pricing from "@/components/Pricing";
import About from "@/components/About";

export default function LandingPage() {
  return (
    <main className="min-h-screen relative flex flex-col items-center pt-40 pb-20 overflow-x-hidden" id="home">

      
      <ThemeToggle />
      <TopNav />
      <Hero />
      <Pricing />
      <About />
    </main>
  );
}
