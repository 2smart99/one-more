'use client';

import { useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { useWorkoutStore } from '@/store/workoutStore';
import { useWorkoutActions } from '@/hooks/useWorkout';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { RestTimer } from '@/components/workout/RestTimer';
import { AddExerciseSheet } from '@/components/workout/AddExerciseSheet';
import { WorkoutSummary } from '@/components/workout/WorkoutSummary';
import { Button } from '@/components/ui/Button';
import { Workout } from '@/types';
import { formatDuration, intervalToDuration } from 'date-fns';
import { it } from 'date-fns/locale';
import { useEffect, useRef } from 'react';

export default function ActiveWorkoutPage() {
  const { user } = useTelegram();
  const { exercises, startTime } = useWorkoutStore();
  const { finishWorkout, volume, best1RM } = useWorkoutActions(user?.id ?? 0);
  const [showSheet, setShowSheet] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [summary, setSummary] = useState<{ workout: Workout; volume: number; best1RM: number; totalSets: number } | null>(null);
  const [elapsed, setElapsed] = useState('00:00');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!startTime) return;
      const dur = intervalToDuration({ start: startTime, end: new Date() });
      setElapsed(
        `${String(dur.hours ?? 0).padStart(2, '0')}:${String(dur.minutes ?? 0).padStart(2, '0')}:${String(dur.seconds ?? 0).padStart(2, '0')}`
      );
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTime]);

  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);
    const allSets = exercises.flatMap((e) => e.sets);
    const completedCount = allSets.filter((s) => s.completed).length;
    const w = await finishWorkout();
    if (w) setSummary({ workout: w, volume, best1RM, totalSets: completedCount });
    setFinishing(false);
  }

  if (summary) {
    return <WorkoutSummary {...summary} />;
  }

  if (!user?.id) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 glass-panel px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary font-semibold">IN CORSO</p>
          <p className="text-lg font-extrabold text-text-primary">{elapsed}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-secondary">Volume</p>
          <p className="text-lg font-extrabold text-accent">{volume.toLocaleString()} kg</p>
        </div>
      </div>

      <div className="px-4 pt-3 pb-32 space-y-4">
        {exercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">💪</p>
            <p className="text-text-secondary text-sm">Aggiungi il primo esercizio per iniziare</p>
          </div>
        )}

        {exercises.map((ae) => (
          <ExerciseCard key={ae.exercise.id} activeExercise={ae} userId={user.id} />
        ))}

        <Button
          fullWidth
          size="lg"
          variant="secondary"
          onClick={() => setShowSheet(true)}
        >
          + Aggiungi Esercizio
        </Button>
      </div>

      {/* Floating finish button */}
      <div className="fixed bottom-20 left-4 right-4 z-40">
        <Button
          fullWidth
          size="lg"
          variant="danger"
          loading={finishing}
          onClick={handleFinish}
          className="shadow-soft-xl"
        >
          Termina Allenamento
        </Button>
      </div>

      {/* Rest timer overlay */}
      <RestTimer />

      {/* Add exercise sheet */}
      {showSheet && (
        <AddExerciseSheet userId={user.id} onClose={() => setShowSheet(false)} />
      )}
    </div>
  );
}
