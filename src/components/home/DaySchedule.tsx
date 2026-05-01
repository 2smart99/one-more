'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Routine } from '@/types';
import { Button } from '@/components/ui/Button';

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const MUSCLE_COLORS: Record<string, string> = {
  Chest: 'bg-blue-100 text-blue-700',
  Back: 'bg-emerald-100 text-emerald-700',
  Legs: 'bg-orange-100 text-orange-700',
  Shoulders: 'bg-purple-100 text-purple-700',
  Arms: 'bg-red-100 text-red-700',
  Core: 'bg-gray-100 text-gray-600',
};

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
    return <div className="mx-4 h-36 bg-surface rounded-card border border-border animate-pulse" />;
  }

  if (!routine) {
    return (
      <div className="mx-4 bg-surface rounded-card border-2 border-dashed border-border p-6 text-center">
        <p className="text-text-muted text-sm font-medium mb-3">Nessuna scheda per {todayName}</p>
        <Link href="/routines">
          <Button variant="secondary" size="sm">Crea scheda per oggi</Button>
        </Link>
      </div>
    );
  }

  const exercises = routine.routine_exercises ?? [];
  const muscleGroups = [...new Set(exercises.map((re) => re.exercise?.muscle_group).filter(Boolean))];

  return (
    <div className="mx-4 bg-surface rounded-card border border-border shadow-card overflow-hidden">
      {/* Header strip */}
      <div className="hero-gradient px-5 py-4">
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest">{todayName}</p>
        <h2 className="text-white text-xl font-extrabold tracking-tight">{routine.title}</h2>
        <p className="text-blue-200 text-sm mt-0.5">{exercises.length} esercizi</p>
      </div>

      {/* Muscle group tags */}
      <div className="px-5 py-3 flex flex-wrap gap-1.5">
        {muscleGroups.slice(0, 4).map((m) => (
          <span key={m} className={`text-xs font-semibold rounded-pill px-2.5 py-0.5 ${MUSCLE_COLORS[m as string] ?? 'bg-gray-100 text-gray-600'}`}>
            {m}
          </span>
        ))}
      </div>

      <div className="px-5 pb-5">
        <Link href={`/workout?routine=${routine.id}`}>
          <Button fullWidth size="lg">Inizia Allenamento</Button>
        </Link>
      </div>
    </div>
  );
}
