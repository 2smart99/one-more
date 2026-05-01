'use client';

import { useEffect, useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/lib/supabase';
import { ExerciseHistory, WorkoutSet } from '@/types';
import { Header } from '@/components/layout/Header';
import { PRCard } from '@/components/history/PRCard';
import { brzycki1RM, totalVolume } from '@/lib/telegram';
import { format } from 'date-fns';

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

      // Group by exercise
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

      // Sort by most recently performed
      result.sort((a, b) => (b.last_performed ?? '') > (a.last_performed ?? '') ? 1 : -1);
      setHistories(result);
      setLoading(false);
    }

    load();
  }, [user?.id]);

  return (
    <div className="px-4 space-y-4">
      <Header title="Progressi" subtitle="Analisi e record personali" />

      {/* Tabs */}
      <div className="flex bg-surface rounded-pill p-1 shadow-soft">
        {(['progress', 'log'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-semibold rounded-pill transition-all ${
              activeTab === tab ? 'bg-accent text-white shadow-soft' : 'text-text-secondary'
            }`}
          >
            {tab === 'progress' ? 'Per Esercizio' : 'Storico'}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-surface rounded-card animate-pulse" />
          ))}
        </div>
      )}

      {!loading && histories.length === 0 && (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-4xl mb-3">📊</p>
          <p>Completa il tuo primo allenamento<br />per vedere i progressi qui</p>
        </div>
      )}

      {activeTab === 'progress' && !loading && (
        <div className="space-y-4">
          {histories.map((h) => (
            <PRCard key={h.exercise_id} history={h} />
          ))}
        </div>
      )}

      {activeTab === 'log' && !loading && (
        <WorkoutLog userId={user?.id ?? 0} />
      )}
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
    return <p className="text-center text-text-secondary py-10">Nessun allenamento completato</p>;
  }

  return (
    <div className="space-y-3">
      {workouts.map((w) => {
        const start = new Date(w.start_time);
        const end = new Date(w.end_time);
        const mins = Math.round((end.getTime() - start.getTime()) / 60000);
        return (
          <div key={w.id} className="bg-surface rounded-2xl p-4 shadow-soft flex items-center justify-between">
            <div>
              <p className="font-bold text-text-primary">{format(start, 'EEE d MMM', { locale: undefined })}</p>
              <p className="text-xs text-text-secondary">{format(start, 'HH:mm')} · {mins} min · {w.sets_count} serie</p>
            </div>
            <span className="text-2xl">🏋️</span>
          </div>
        );
      })}
    </div>
  );
}
