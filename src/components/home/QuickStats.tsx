'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { startOfMonth, format } from 'date-fns';

interface QuickStatsProps {
  userId: number;
}

interface Stats {
  monthVolume: number;
  weekSessions: number;
  totalSessions: number;
}

export function QuickStats({ userId }: QuickStatsProps) {
  const [stats, setStats] = useState<Stats>({ monthVolume: 0, weekSessions: 0, totalSessions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const weekStart = format(new Date(Date.now() - 7 * 86400000), 'yyyy-MM-dd');

      const [monthRes, weekRes, totalRes] = await Promise.all([
        supabase
          .from('workout_sets')
          .select('weight, reps, workouts!inner(user_id, start_time)')
          .eq('workouts.user_id', userId)
          .eq('completed', true)
          .gte('workouts.start_time', monthStart),
        supabase
          .from('workouts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('start_time', weekStart)
          .not('end_time', 'is', null),
        supabase
          .from('workouts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('end_time', 'is', null),
      ]);

      const monthVolume = (monthRes.data ?? []).reduce(
        (acc: number, s: { weight: number; reps: number }) => acc + s.weight * s.reps,
        0
      );

      setStats({ monthVolume, weekSessions: weekRes.count ?? 0, totalSessions: totalRes.count ?? 0 });
      setLoading(false);
    }
    load();
  }, [userId]);

  const items = [
    { label: 'Volume mese', value: loading ? '—' : `${(stats.monthVolume / 1000).toFixed(1)}t`, unit: 'tonnellate' },
    { label: 'Sessioni 7gg', value: loading ? '—' : String(stats.weekSessions), unit: 'allenamenti' },
    { label: 'Totale', value: loading ? '—' : String(stats.totalSessions), unit: 'sessioni' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      {items.map(({ label, value }) => (
        <div key={label} className="bg-surface rounded-card shadow-card p-4 text-center border border-border">
          <div className="text-2xl font-extrabold text-text-primary tracking-tight">{value}</div>
          <div className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}
