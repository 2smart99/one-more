'use client';

import { useEffect, useState } from 'react';
import { getTelegramWebApp, TelegramUser, TelegramWebApp } from '@/lib/telegram';

export function useTelegram() {
  const [twa, setTwa] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    const app = getTelegramWebApp();
    if (app) {
      app.ready();
      app.expand();
      setTwa(app);
      setUser(app.initDataUnsafe?.user ?? null);
    } else {
      // Dev fallback
      setUser({ id: 999999, first_name: 'Developer' });
    }
  }, []);

  return { twa, user };
}
