"use client";

// 1. Make sure the import path is correct based on where you saved RotatingText.tsx
import RotatingText from './RotatingText'; 

export default function Hero() {
  return (
    <div className="flex flex-col items-center justify-center text-center w-full z-10 relative">
      
      {/* Your existing main titles */}
      <h1 className="text-6xl md:text-8xl font-black tracking-tight text-[#011F4B] dark:text-white mb-2">
        World's No.01
      </h1>
      <h2 className="text-6xl md:text-8xl font-black tracking-tight text-gray-400/50 mb-12">
        Banking AI
      </h2>

      {/* --- ROTATING TEXT SECTION --- */}
      <div className="flex items-center gap-3 text-2xl md:text-3xl font-bold mb-16 text-[#011F4B] dark:text-white">
        <span>For Your</span>
        
        {/* We replaced the static box with RotatingText */}
        <RotatingText
          texts={[
            'Personal Banking', 
            'Business Loans', 
            'Banking Applications', 
            'Savings Guide'
          ]}
          // Updated styling to match your dark blue box and white text
          mainClassName="px-4 sm:px-5 md:px-6 bg-[#011F4B] text-white overflow-hidden py-2 sm:py-3 md:py-3 justify-center rounded-xl shadow-lg"
          staggerFrom="last"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-120%" }}
          staggerDuration={0.025}
          splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          // Increased interval slightly so users have time to read longer phrases
          rotationInterval={3000} 
          splitBy="characters"
          auto
          loop
        />
        
        <span>Needs</span>
      </div>
      {/* ----------------------------- */}

      {/* Your existing CTA Button */}
      <div className="flex items-center bg-white dark:bg-[#011F4B] rounded-full p-2 pr-2 pl-6 shadow-xl border border-gray-100 dark:border-white/10">
        <span className="font-semibold text-sm mr-4 text-[#011F4B] dark:text-white">Chat with Doctor Bank</span>
        <button className="bg-[#011F4B] dark:bg-brand-primary text-white px-6 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-opacity">
          Start
        </button>
      </div>

    </div>
  );
}