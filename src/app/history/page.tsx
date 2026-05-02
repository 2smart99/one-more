'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/lib/supabase';
import { ExerciseHistory, WorkoutSet } from '@/types';
import { PRCard } from '@/components/history/PRCard';
import { brzycki1RM, totalVolume } from '@/lib/telegram';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function HistoryPage() {
  const { user } = useTelegram();
  const [histories, setHistories] = useState<ExerciseHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'progress' | 'log'>('progress');

  useEffect(() => {
    if (!user?.id) return;

    async function load() {
      const { data: sets } = await supabase
        .from('workout_sets')
        .select('*, exercise:exercises(*), workout:workouts!inner(user_id, start_time, end_time)')
        .eq('workout.user_id', user!.id)
        .not('workout.end_time', 'is', null)
        .eq('completed', true)
        .order('created_at', { ascending: true });

      if (!sets) { setLoading(false); return; }

      const map = new Map<string, { name: string; byWorkout: Map<string, WorkoutSet[]> }>();
      for (const s of sets as (WorkoutSet & { workout: { start_time: string } })[]) {
        if (!s.exercise_id || !s.exercise) continue;
        const exKey = s.exercise_id;
        if (!map.has(exKey)) map.set(exKey, { name: s.exercise.name, byWorkout: new Map() });
        const wKey = format(new Date((s as { workout: { start_time: string } }).workout.start_time), 'yyyy-MM-dd');
        const entry = map.get(exKey)!;
        if (!entry.byWorkout.has(wKey)) entry.byWorkout.set(wKey, []);
        entry.byWorkout.get(wKey)!.push(s);
      }

      const result: ExerciseHistory[] = [];
      for (const [exId, data] of Array.from(map.entries())) {
        const volumeTrend = [];
        const oneRMTrend = [];
        let bestVolume = 0;
        let best1RM = 0;
        let lastDate: string | undefined;

        for (const [date, wSets] of Array.from(data.byWorkout.entries())) {
          const vol = totalVolume(wSets);
          const dayBest1RM = Math.max(0, ...wSets.map((s) => brzycki1RM(s.weight, s.reps)));
          volumeTrend.push({ date, volume: vol });
          oneRMTrend.push({ date, volume: dayBest1RM });
          if (vol > bestVolume) bestVolume = vol;
          if (dayBest1RM > best1RM) best1RM = dayBest1RM;
          lastDate = date;
        }

        result.push({
          exercise_id: exId,
          exercise_name: data.name,
          best_1rm: best1RM,
          best_volume: bestVolume,
          last_performed: lastDate,
          volume_trend: volumeTrend,
          one_rm_trend: oneRMTrend,
        });
      }

      result.sort((a, b) => (b.last_performed ?? '') > (a.last_performed ?? '') ? 1 : -1);
      setHistories(result);
      setLoading(false);
    }

    load();
  }, [user?.id]);

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg-primary)' }}>

      {/* Header */}
      <div className="px-5 pt-8 pb-5">
        <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
          Progressi
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Record personali e storico
        </p>
      </div>

      <div className="px-4 space-y-4 pb-8">

        {/* Tab switcher */}
        <div
          className="flex p-1"
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border)',
          }}
        >
          {(['progress', 'log'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 text-sm font-semibold transition-all"
              style={{
                borderRadius: 'var(--radius-pill)',
                background: activeTab === tab ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === tab ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                boxShadow: activeTab === tab ? 'var(--shadow-accent)' : 'none',
              }}
            >
              {tab === 'progress' ? 'Per Esercizio' : 'Storico'}
            </button>
          ))}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  height: 180,
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && histories.length === 0 && (
          <div
            className="text-center py-16 px-6"
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '2px dashed var(--border)',
            }}
          >
            <div className="text-4xl mb-4">📈</div>
            <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Nessun dato ancora
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Completa il tuo primo allenamento per vedere i progressi
            </p>
          </div>
        )}

        {/* Per Esercizio */}
        {activeTab === 'progress' && !loading && histories.length > 0 && (
          <div className="space-y-4">
            {histories.map((h) => (
              <PRCard key={h.exercise_id} history={h} />
            ))}
          </div>
        )}

        {/* Storico */}
        {activeTab === 'log' && !loading && (
          <WorkoutLog userId={user?.id ?? 0} />
        )}
      </div>
    </div>
  );
}

function WorkoutLog({ userId }: { userId: number }) {
  const [workouts, setWorkouts] = useState<{ id: string; start_time: string; end_time: string; sets_count: number }[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('workouts')
      .select('id, start_time, end_time, workout_sets(count)')
      .eq('user_id', userId)
      .not('end_time', 'is', null)
      .order('start_time', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setWorkouts(
          (data ?? []).map((w: { id: string; start_time: string; end_time: string; workout_sets: { count: number }[] }) => ({
            id: w.id,
            start_time: w.start_time,
            end_time: w.end_time,
            sets_count: w.workout_sets?.[0]?.count ?? 0,
          }))
        );
      });
  }, [userId]);

  if (workouts.length === 0) {
    return (
      <div className="text-center py-10" style={{ color: 'var(--text-secondary)' }}>
        <p>Nessun allenamento completato</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {workouts.map((w) => {
        const start = new Date(w.start_time);
        const end = new Date(w.end_time);
        const mins = Math.round((end.getTime() - start.getTime()) / 60000);
        return (
          <div
            key={w.id}
            className="flex items-center justify-between px-4 py-4"
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--accent-primary)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {format(start, 'EEE d MMM', { locale: it }).replace(/^\w/, (c) => c.toUpperCase())}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {format(start, 'HH:mm')} · {mins} min · {w.sets_count} serie
              </p>
            </div>
            <div
              className="w-9 h-9 flex items-center justify-center"
              style={{
                background: 'rgba(200,241,53,0.12)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
