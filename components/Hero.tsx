// components/Hero.tsx
import Link from "next/link";
export default function Hero() {
  return (
    <section className="flex flex-col items-center text-center px-4 w-full max-w-5xl mt-10">
      <h1 className="text-6xl md:text-[5.5rem] font-black tracking-tight text-brand-primary dark:text-white leading-[1.1]">
        World's No.01
        <br />
        <span className="text-[#8BA3B8]">Banking AI</span>
      </h1>
      
      <h2 className="text-2xl md:text-[1.75rem] font-bold mt-8 text-brand-primary dark:text-white flex items-center justify-center gap-3">
        For Your <span className="bg-brand-primary text-white px-4 py-1.5 rounded-xl tracking-wide shadow-md">Banking</span> Needs
      </h2>

      <button className="mt-14 flex items-center gap-4 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-200 dark:border-gray-700 rounded-full pl-6 pr-2 py-2 text-lg font-bold text-brand-primary dark:text-white hover:shadow-lg transition-all">
        Chat with Doctor Bank
        <span className="bg-brand-primary text-white px-6 py-2 rounded-full text-sm font-semibold">Start</span>
      </button>
    </section>
  );
}