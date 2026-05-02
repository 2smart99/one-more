'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/lib/supabase';
import { DaySchedule } from '@/components/home/DaySchedule';
import { QuickStats } from '@/components/home/QuickStats';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface RecentWorkout {
  id: string;
  start_time: string;
  volume: number;
}

export default function HomePage() {
  const { user } = useTelegram();
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('users')
      .upsert({ tg_id: user.id, first_name: user.first_name, username: user.username })
      .then(() => {});
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    async function loadRecent() {
      const { data: workouts } = await supabase
        .from('workouts')
        .select('id, start_time')
        .eq('user_id', user!.id)
        .not('end_time', 'is', null)
        .order('start_time', { ascending: false })
        .limit(3);

      if (!workouts?.length) return;

      const volumeResults = await Promise.all(
        workouts.map((w) =>
          supabase
            .from('workout_sets')
            .select('weight, reps')
            .eq('workout_id', w.id)
            .eq('completed', true)
        )
      );

      const enriched = workouts.map((w, i) => {
        const sets = volumeResults[i].data ?? [];
        const volume = sets.reduce((acc: number, s: { weight: number; reps: number }) => acc + s.weight * s.reps, 0);
        return { id: w.id, start_time: w.start_time, volume };
      });

      setRecentWorkouts(enriched);
    }

    loadRecent();
  }, [user?.id]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  const today = format(new Date(), "EEEE d MMMM", { locale: it });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="px-5 pt-8 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {todayCapitalized}
            </p>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.15, marginTop: 2 }}>
              Ciao, {user.first_name} 👋
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="space-y-6">
        {/* Stat Cards */}
        <QuickStats userId={user.id} />

        {/* Scheda di oggi */}
        <div>
          <p className="section-label px-5 mb-3">Scheda di oggi</p>
          <DaySchedule userId={user.id} />
        </div>

        {/* Ultimi allenamenti */}
        {recentWorkouts.length > 0 && (
          <div>
            <p className="section-label px-5 mb-3">Ultimi allenamenti</p>
            <div className="px-4 space-y-2">
              {recentWorkouts.map((w) => {
                const d = new Date(w.start_time);
                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between px-5 py-4"
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {format(d, 'EEEE d MMM', { locale: it }).replace(/^\w/, (c) => c.toUpperCase())}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {format(d, 'HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-sm font-stat" style={{ color: 'var(--text-primary)' }}>
                        {w.volume >= 1000 ? `${(w.volume / 1000).toFixed(1)}t` : `${w.volume}kg`}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                        volume
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
