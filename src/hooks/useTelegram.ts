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
      // Dev fallback — upsert so foreign keys don't fail
      const devUser = { id: 999999, first_name: 'Developer' };
      import('@/lib/supabase').then(({ supabase }) => {
        supabase.from('users').upsert({ tg_id: devUser.id, first_name: devUser.first_name }).then(() => {});
      });
      setUser(devUser);
    }
  }, []);

  return { twa, user };
}
