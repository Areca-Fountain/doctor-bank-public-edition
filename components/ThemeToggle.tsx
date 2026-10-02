'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="fixed top-8 right-8 z-50 flex flex-col gap-3">
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={`
          relative w-[60px] h-[32px] rounded-full outline-none flex items-center shrink-0
          transition-colors duration-300 ease-in-out px-1 shadow-sm border cursor-pointer
          ${isDark ? 'bg-black border-black' : 'bg-white border-gray-200'}
        `}
      >
        <div className={`w-[22px] h-[22px] rounded-full transition-transform duration-300 ${isDark ? 'translate-x-[28px] bg-white' : 'translate-x-0 bg-brand-primary'}`} />
      </button>
    </div>
  );
}
