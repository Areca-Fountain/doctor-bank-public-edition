// components/StarsBackgroundDemo.tsx
"use client";

import { StarsBackground } from '@/components/animate-ui/components/backgrounds/stars';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export const StarsBackgroundDemo = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <StarsBackground
      starColor={resolvedTheme === 'dark' ? '#ffffff' : '#001f3f'} 
      className={cn(
        'absolute inset-0 w-full h-full -z-10', 
        'dark:bg-[radial-gradient(ellipse_at_bottom,_#001f3f_0%,_#00050d_100%)] bg-[radial-gradient(ellipse_at_bottom,_#f0f4f8_0%,_#ffffff_100%)]',
      )}
    />
  );
};