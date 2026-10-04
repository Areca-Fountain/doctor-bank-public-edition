import TopNav from "@/components/TopNav";
import ThemeToggle from "@/components/ThemeToggle";
import Hero from "@/components/Hero";
import PlanSection from "@/components/PlanSection";
import About from "@/components/About";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollProgress from "@/components/ScrollProgress";

export default function LandingPage() {
  return (
    <main className="min-h-screen relative flex flex-col items-center pt-28 md:pt-40 pb-20 overflow-x-hidden" id="home">
      <SmoothScroll />
      <ScrollProgress />
      <ThemeToggle />
      <TopNav />
      <Hero />
      <PlanSection />
      <About />
    </main>
  );
}