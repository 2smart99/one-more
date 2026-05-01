'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/layout/Header';
import { DaySchedule } from '@/components/home/DaySchedule';
import { QuickStats } from '@/components/home/QuickStats';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function HomePage() {
  const { user } = useTelegram();

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('users')
      .upsert({ tg_id: user.id, first_name: user.first_name, username: user.username })
      .then(() => {});
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buongiorno';
    if (h < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  })();

  return (
    <div className="px-4 space-y-4">
      {/* Header */}
      <Header
        title={`${greeting}, ${user.first_name} 👋`}
        subtitle="Pronto per allenarti?"
      />

      {/* Quick stats */}
      <QuickStats userId={user.id} />

      {/* Today's schedule */}
      <section>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide px-1 mb-2">
          Scheda di Oggi
        </h2>
        <DaySchedule userId={user.id} />
      </section>

      {/* Quick start */}
      <section>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide px-1 mb-2">
          Avvio Rapido
        </h2>
        <Link href="/workout">
          <Button fullWidth size="lg" variant="secondary">
            + Sessione Libera
          </Button>
        </Link>
      </section>
    </div>
  );
}
