'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/lib/supabase';
import { DaySchedule } from '@/components/home/DaySchedule';
import { QuickStats } from '@/components/home/QuickStats';
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
        .limit(2);

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
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const today = format(new Date(), "EEEE d MMMM", { locale: it });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="px-5 pt-8 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-t2 text-sm font-medium">{todayCapitalized}</p>
            <h1 className="text-t1 text-3xl font-extrabold tracking-tight leading-tight mt-0.5">
              Ciao, {user.first_name}
            </h1>
          </div>
          <span className="text-[10px] text-t2/50 font-medium">v1.0</span>
        </div>
      </div>

      <div className="space-y-5">
        {/* Stats */}
        <QuickStats userId={user.id} />

        {/* Today's schedule */}
        <div>
          <p className="text-[11px] font-bold text-t2 uppercase tracking-widest px-5 mb-3">
            Scheda di oggi
          </p>
          <DaySchedule userId={user.id} />
        </div>

        {/* Recent workouts */}
        {recentWorkouts.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-t2 uppercase tracking-widest px-5 mb-3">
              Ultimi allenamenti
            </p>
            <div className="px-4 space-y-2">
              {recentWorkouts.map((w) => {
                const d = new Date(w.start_time);
                return (
                  <div
                    key={w.id}
                    className="bg-surface rounded-2xl border border-border px-5 py-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-t1 text-sm">
                        {format(d, 'EEEE d MMM', { locale: it }).replace(/^\w/, (c) => c.toUpperCase())}
                      </p>
                      <p className="text-t2 text-xs mt-0.5">{format(d, 'HH:mm')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-t1 text-sm">
                        {w.volume >= 1000 ? `${(w.volume / 1000).toFixed(1)}t` : `${w.volume}kg`}
                      </p>
                      <p className="text-t2 text-[10px] uppercase tracking-wide">volume</p>
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
