"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import RotatingText from './RotatingText'; 

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.15 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

export default function Hero() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center text-center w-full z-10 relative px-4"
    >
      
      {/* Main titles */}
      <motion.h1 variants={item} className="text-4xl min-[400px]:text-5xl sm:text-6xl md:text-8xl font-black tracking-tight text-brand-primary dark:text-white mb-2">
        Simplified Banking
 Issues
      </h1>
      <h2 className="text-6xl md:text-8xl font-black tracking-tight text-gray-400/80 mb-12">

      </motion.h1>
      <motion.h2 variants={item} className="text-4xl min-[400px]:text-5xl sm:text-6xl md:text-8xl font-black tracking-tight text-gray-400/50 mb-8 md:mb-12">
 main
        AI Assistant
      </motion.h2>

      {/* --- ROTATING TEXT SECTION --- */}
      <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3 text-lg sm:text-2xl md:text-3xl font-bold mb-10 md:mb-16 text-brand-primary dark:text-white">
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
      </motion.div>

      {/* Connected CTA Link */}
      <motion.div variants={item} className="mt-6 md:mt-14 w-full flex justify-center">
      <Link 
        href="/chat" 
        className="flex items-center gap-3 sm:gap-4 bg-white dark:bg-black shadow-xl border border-gray-100 dark:border-white/10 rounded-full pl-5 sm:pl-6 pr-2 py-2 text-base sm:text-lg font-bold text-brand-primary dark:text-white [@media(hover:hover)]:hover:scale-105 [@media(hover:hover)]:hover:shadow-2xl active:scale-95 transition-all duration-200 touch-target"
      >
        Chat with Doctor Bank
        <span className="bg-brand-primary dark:bg-white text-white dark:text-brand-primary px-6 py-2 rounded-full text-sm font-semibold transition-colors">
          Start
        </span>
      </Link>
      </motion.div>

    </motion.div>
  );
}