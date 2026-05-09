'use client';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="fixed top-8 right-8 z-50 flex flex-col gap-3">
      <button
        onClick={() => setIsDark(!isDark)}
        className={`
          relative w-[60px] h-[32px] rounded-full outline-none flex items-center shrink-0
          transition-colors duration-300 ease-in-out px-1 shadow-sm border cursor-pointer
          ${isDark ? 'bg-[#011F4B] border-[#011F4B]' : 'bg-white border-gray-200'}
        `}
      >
        <div className={`w-[22px] h-[22px] rounded-full transition-transform duration-300 ${isDark ? 'translate-x-[28px] bg-white' : 'translate-x-0 bg-[#011F4B]'}`} />
      </button>
    </div>
  );
}