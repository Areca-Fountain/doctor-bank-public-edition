"use client";

import Link from "next/link";
import RotatingText from './RotatingText'; 

export default function Hero() {
  return (
    <div className="flex flex-col items-center justify-center text-center w-full z-10 relative">
      
      {/* Main titles */}
      <h1 className="text-6xl md:text-8xl font-black tracking-tight text-brand-primary dark:text-white mb-2">
        World's No.01
      </h1>
      <h2 className="text-6xl md:text-8xl font-black tracking-tight text-gray-400/50 mb-12">
        Banking AI
      </h2>

      {/* --- ROTATING TEXT SECTION --- */}
      <div className="flex items-center gap-3 text-2xl md:text-3xl font-bold mb-16 text-brand-primary dark:text-white">
        <span>For Your</span>
        
        <RotatingText
          texts={[
            'Personal Banking', 
            'Business Loans', 
            'Banking Applications', 
            'Savings Guide'
          ]}
          mainClassName="px-4 sm:px-5 md:px-6 bg-brand-primary text-white overflow-hidden py-2 sm:py-3 md:py-3 justify-center rounded-xl shadow-lg"
          staggerFrom="last"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-120%" }}
          staggerDuration={0.025}
          splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          rotationInterval={3000} 
          splitBy="characters"
          auto
          loop
        />
        
        <span>Needs</span>
      </div>

      {/* Connected CTA Link */}
      <Link 
        href="/chat" 
        className="mt-14 flex items-center gap-4 bg-white dark:bg-black shadow-xl border border-gray-100 dark:border-white/10 rounded-full pl-6 pr-2 py-2 text-lg font-bold text-brand-primary dark:text-white hover:scale-105 transition-transform duration-200"
      >
        Chat with Doctor Bank
        <span className="bg-brand-primary dark:bg-white text-white dark:text-brand-primary px-6 py-2 rounded-full text-sm font-semibold transition-colors">
          Start
        </span>
      </Link>

    </div>
  );
}
