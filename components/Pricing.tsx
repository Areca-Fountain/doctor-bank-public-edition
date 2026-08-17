// components/Pricing.tsx
export default function Pricing() {
  return (
    <section id="pricing" className="mt-32 flex flex-col items-center w-full px-4 mb-20">
      <div className="text-center max-w-xl">
        <h3 className="text-4xl md:text-5xl font-black text-[#4C1D95] dark:text-white tracking-tight">
          Plans & Pricing
        </h3>
        <p className="text-gray-500 dark:text-gray-400 font-medium mt-3 text-sm md:text-base">
          Save Your Money & Time
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-stretch justify-center gap-8 mt-12 w-full max-w-4xl">
        {/* Free Plan */}
        <div className="w-full max-w-[320px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <div className="text-center">
              <h4 className="text-[#9333EA] dark:text-purple-400 font-bold text-xl">
                Free
              </h4>
              <div className="text-5xl font-black text-gray-900 dark:text-white mt-4">
                $0
              </div>
              <p className="text-xs text-gray-500 font-medium mt-2">
                For Personal Use
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-3 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
                  Solve Your Quick Problems
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
                  Limited Credits
                </li>
              </ul>
            </div>
          </div>

          <button className="mt-8 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 w-full py-3 rounded-full text-sm font-bold cursor-not-allowed">
            Current Plan
          </button>
        </div>

        {/* Full House Plan */}
        <div className="w-full max-w-[320px] bg-purple-50/50 dark:bg-gray-900/90 border-2 border-[#9333EA] rounded-3xl p-8 flex flex-col justify-between shadow-xl relative overflow-hidden transform md:-translate-y-2">
          {/* Top Banner Badge */}
          <div className="absolute top-0 left-0 w-full bg-[#9333EA] text-white text-[10px] font-black uppercase tracking-widest py-1.5 text-center">
            Most Popular
          </div>

          <div className="pt-4">
            <div className="text-center">
              <h4 className="text-[#4C1D95] dark:text-purple-300 font-bold text-xl">
                Full House
              </h4>
              <div className="text-5xl font-black text-[#4C1D95] dark:text-white mt-4 flex items-baseline justify-center">
                $10
                <span className="text-sm font-bold text-purple-600 dark:text-purple-300 ml-1">
                  /month
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-2">
                For Commercial Use
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-purple-200/60 dark:border-gray-800">
              <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-3 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
                  Solve Your Quick Problems
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
                  Unlimited AI Credits
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
                  Priority Processing
                </li>
              </ul>
            </div>
          </div>

          <button className="mt-8 bg-[#9333EA] hover:bg-[#7E22CE] text-white w-full py-3 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer">
            Get Advanced
          </button>
        </div>
      </div>
    </section>
  );
}