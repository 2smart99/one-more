'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/lib/supabase';
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
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero header */}
      <div className="hero-gradient px-5 pt-8 pb-8">
        <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-1">{greeting}</p>
        <h1 className="text-white text-3xl font-extrabold tracking-tight leading-tight">
          {user.first_name}
        </h1>
        <p className="text-blue-200 text-sm mt-1 font-medium">Pronto per il prossimo allenamento?</p>
      </div>

      {/* Stats — float over hero */}
      <div className="mt-4 space-y-4">
        <QuickStats userId={user.id} />

        {/* Today's schedule */}
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest px-5 mb-3">
            Scheda di oggi
          </p>
          <DaySchedule userId={user.id} />
        </div>

        {/* Quick start */}
        <div className="px-4">
          <Link href="/workout">
            <Button fullWidth size="lg" variant="secondary">
              + Sessione libera
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
