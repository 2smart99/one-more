'use client';

import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const twa = (window as { Telegram?: { WebApp?: { colorScheme?: string } } }).Telegram?.WebApp;
    const scheme =
      twa?.colorScheme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (scheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return <>{children}</>;
}
