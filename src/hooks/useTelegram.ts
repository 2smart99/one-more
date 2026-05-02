'use client';

import { useEffect, useState } from 'react';
import { getTelegramWebApp, TelegramUser, TelegramWebApp } from '@/lib/telegram';
import { supabase, setUserContext } from '@/lib/supabase';

export function useTelegram() {
  const [twa, setTwa] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    const app = getTelegramWebApp();
    if (app) {
      app.ready();
      app.expand();
      setTwa(app);
      const tgUser = app.initDataUnsafe?.user ?? null;
      setUser(tgUser);
      // Set RLS context so row-level security policies can identify the user
      if (tgUser) {
        setUserContext(tgUser.id).catch((err) =>
          console.error('[useTelegram] setUserContext failed:', err)
        );
      }
    } else {
      // Dev fallback — upsert so foreign keys don't fail
      const devUser = { id: 999999, first_name: 'Developer' };
      setUser(devUser);
      setUserContext(devUser.id).catch((err) =>
        console.error('[useTelegram] setUserContext (dev) failed:', err)
      );
      supabase.from('users').upsert({ tg_id: devUser.id, first_name: devUser.first_name }).then(() => {});
    }
  }, []);

  return { twa, user };
}
