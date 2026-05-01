'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Routine } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

interface DayScheduleProps {
  userId: number;
}

export function DaySchedule({ userId }: DayScheduleProps) {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);

  const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0
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
    return (
      <Card className="animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
        <div className="h-8 bg-gray-100 rounded w-2/3" />
      </Card>
    );
  }

  if (!routine) {
    return (
      <Card className="border-2 border-dashed border-gray-200 bg-transparent shadow-none text-center">
        <p className="text-text-secondary text-sm mb-3">
          Nessuna scheda per {todayName}
        </p>
        <Link href="/routines">
          <Button variant="secondary" size="sm">+ Crea scheda per oggi</Button>
        </Link>
      </Card>
    );
  }

  const exercises = routine.routine_exercises ?? [];

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{todayName}</p>
          <h2 className="text-xl font-extrabold text-text-primary">{routine.title}</h2>
        </div>
        <Badge label={`${exercises.length} esercizi`} color="blue" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {exercises.slice(0, 5).map((re) => (
          <span key={re.id} className="text-xs bg-background rounded-pill px-3 py-1 text-text-secondary font-medium shadow-soft">
            {re.exercise?.name}
          </span>
        ))}
        {exercises.length > 5 && (
          <span className="text-xs bg-background rounded-pill px-3 py-1 text-text-secondary font-medium shadow-soft">
            +{exercises.length - 5} altri
          </span>
        )}
      </div>

      <Link href={`/workout?routine=${routine.id}`}>
        <Button fullWidth size="lg">
          Inizia Allenamento
        </Button>
      </Link>
    </Card>
  );
}
