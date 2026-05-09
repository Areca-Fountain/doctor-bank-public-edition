// components/Pricing.tsx
export default function Pricing() {
  return (
    <section id="pricing" className="mt-40 flex flex-col items-center w-full px-4">
      <h3 className="text-4xl font-black text-brand-primary dark:text-white tracking-tight">Plans & Pricing</h3>
      <p className="text-gray-400 font-medium mt-2 text-sm">Save Your Money & Time</p>

      <div className="flex flex-col md:flex-row gap-8 mt-12">
        {/* Free Plan */}
        <div className="w-[280px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-[2rem] p-8 flex flex-col items-center text-center shadow-sm">
          <h4 className="text-brand-primary dark:text-white font-bold text-xl">Free</h4>
          <div className="text-5xl font-black text-brand-primary dark:text-white mt-4">$0</div>
          <p className="text-[11px] text-gray-500 font-medium mt-4">For Personal Use</p>
          <button className="mt-6 bg-[#E2E8F0] dark:bg-gray-800 text-gray-500 dark:text-gray-400 w-full py-2.5 rounded-full text-sm font-bold pointer-events-none">
            Current Plan
          </button>
          <div className="mt-6 w-full text-left">
            <ul className="text-[10px] text-gray-500 dark:text-gray-400 font-medium list-disc pl-4 space-y-2">
              <li>Solve Your Quick Problems</li>
              <li>Limited Credits</li>
            </ul>
          </div>
        </div>

        {/* Full House Plan */}
        <div className="w-[280px] bg-[#EAEFF5] dark:bg-gray-800 border border-[#d0dbe7] dark:border-gray-700 rounded-[2rem] shadow-md flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-16 bg-brand-primary rounded-b-[1.5rem]"></div>
          <div className="p-8 flex flex-col items-center text-center z-10 mt-2">
            <h4 className="text-brand-primary dark:text-white font-bold text-xl">Full House</h4>
            <div className="text-5xl font-black text-brand-primary dark:text-white mt-4 flex items-baseline justify-center">
              $10<span className="text-sm font-bold text-brand-primary/80 dark:text-white/80">/year</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-4">For Commercial Use</p>
            <button className="mt-6 bg-brand-primary text-white w-full py-2.5 rounded-full text-sm font-bold shadow-md">
              Get Advanced
            </button>
            <div className="mt-6 w-full text-left">
              <ul className="text-[10px] text-gray-500 dark:text-gray-400 font-medium list-disc pl-4 space-y-2">
                <li>Solve Your Quick Problems</li>
                <li>Limited Credits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}