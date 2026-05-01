'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Routine } from '@/types';
import { Button } from '@/components/ui/Button';

const DAY_NAMES = ['Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato', 'Domenica'];

interface DayScheduleProps {
  userId: number;
}

export function DaySchedule({ userId }: DayScheduleProps) {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);

  const todayIndex = (new Date().getDay() + 6) % 7;
  const todayName = DAY_NAMES[todayIndex];

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('routines')
        .select('*, routine_exercises(*, exercise:exercises(*))')
        .eq('user_id', userId)
        .eq('day_of_week', todayIndex)
        .maybeSingle();
      setRoutine(data);
      setLoading(false);
    }
    load();
  }, [userId, todayIndex]);

  if (loading) {
    return <div className="mx-4 h-36 bg-surface-2 rounded-2xl animate-pulse" />;
  }

  if (!routine) {
    return (
      <div className="mx-4 bg-surface rounded-2xl border-2 border-dashed border-border p-6 text-center">
        <p className="text-t2 text-sm font-medium mb-3">Nessuna scheda per {todayName}</p>
        <Link href="/routines">
          <Button variant="secondary" size="sm">Crea scheda per oggi</Button>
        </Link>
      </div>
    );
  }

  const exercises = routine.routine_exercises ?? [];
  const muscleGroups = [...new Set(exercises.map((re) => re.exercise?.muscle_group).filter(Boolean))];

  return (
    <div className="mx-4 bg-surface rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between">
        <div>
          <span className="inline-block bg-accent-light text-accent text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-0.5 mb-2">
            {todayName}
          </span>
          <h2 className="text-t1 text-xl font-extrabold tracking-tight">{routine.title}</h2>
          <p className="text-t2 text-sm mt-0.5">{exercises.length} esercizi</p>
        </div>
      </div>

      {/* Muscle group tags */}
      {muscleGroups.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          {muscleGroups.slice(0, 4).map((m) => (
            <span
              key={m as string}
              className="text-xs font-semibold rounded-lg px-2 py-0.5 bg-accent-light text-accent"
            >
              {m as string}
            </span>
          ))}
        </div>
      )}

      <div className="px-5 pb-5">
        <Link href={`/workout?routine=${routine.id}`}>
          <Button fullWidth size="lg">Inizia Allenamento</Button>
        </Link>
      </div>
    </div>
  );
}
