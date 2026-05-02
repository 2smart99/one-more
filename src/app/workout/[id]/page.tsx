'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { useWorkoutStore } from '@/store/workoutStore';
import { useWorkoutActions } from '@/hooks/useWorkout';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { RestTimer } from '@/components/workout/RestTimer';
import { AddExerciseSheet } from '@/components/workout/AddExerciseSheet';
import { WorkoutSummary } from '@/components/workout/WorkoutSummary';
import { Button } from '@/components/ui/Button';
import { Workout } from '@/types';
import { intervalToDuration } from 'date-fns';

export default function ActiveWorkoutPage() {
  const { user } = useTelegram();
  const router = useRouter();
  const { exercises, startTime } = useWorkoutStore();
  const { finishWorkout, volume, best1RM } = useWorkoutActions(user?.id ?? 0);
  const [showSheet, setShowSheet] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [summary, setSummary] = useState<{ workout: Workout; volume: number; best1RM: number; totalSets: number } | null>(null);
  const [elapsed, setElapsed] = useState('00:00:00');
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

  if (summary) return <WorkoutSummary {...summary} />;
  if (!user?.id) return null;

  return (
    <div className="min-h-screen bg-bg">
      {/* Sticky header with back button */}
      <div className="sticky top-0 z-30 bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-2 border border-border text-t2 hover:text-t1 active:scale-90 transition-all shrink-0"
          title="Torna indietro"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="flex-1 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-t2 uppercase tracking-widest">In corso</p>
            <p className="text-lg font-extrabold text-t1 tracking-tight">{elapsed}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-t2 uppercase tracking-widest">Volume</p>
            <p className="text-lg font-extrabold text-accent">{volume.toLocaleString()} kg</p>
          </div>
        </div>
      </div>

      {/* Legend per i tipi di serie */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-3 flex-wrap">
        <span className="text-[10px] text-t2 font-semibold uppercase tracking-wide">Tipi serie:</span>
        {[
          { label: 'N', desc: 'Normale', color: 'bg-surface-2 text-t1 border border-border' },
          { label: 'Ris', desc: 'Riscaldamento', color: 'bg-warning text-white' },
          { label: 'D', desc: 'Drop set', color: 'bg-accent text-accent-fg' },
          { label: 'F', desc: 'Cedimento', color: 'bg-danger text-white' },
        ].map(({ label, desc, color }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`inline-flex items-center justify-center w-7 h-6 rounded-lg text-[10px] font-bold ${color}`}>{label}</span>
            <span className="text-[10px] text-t2">{desc}</span>
          </span>
        ))}
      </div>

      {/* Esercizi — pb grande per non finire sotto il floating button + bottom nav */}
      <div className="px-4 pt-3 pb-48 space-y-3">
        {exercises.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-accent-light rounded-2xl flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <p className="text-t2 text-sm font-medium">Aggiungi il primo esercizio</p>
          </div>
        )}
        {exercises.map((ae) => (
          <ExerciseCard key={ae.exercise.id} activeExercise={ae} userId={user.id} />
        ))}
        <Button fullWidth size="lg" variant="secondary" onClick={() => setShowSheet(true)}>
          + Aggiungi Esercizio
        </Button>
      </div>

      {/* Floating action area: above bottom nav (bottom nav ≈ 88px) + gap */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-[96px] pt-3 bg-gradient-to-t from-bg/95 to-bg/0 pointer-events-none">
        <div className="pointer-events-auto">
          <Button
            fullWidth
            size="lg"
            variant="danger"
            loading={finishing}
            onClick={handleFinish}
            className="shadow-card-lg"
          >
            Termina Allenamento
          </Button>
        </div>
      </div>

      <RestTimer />
      {showSheet && <AddExerciseSheet userId={user.id} onClose={() => setShowSheet(false)} />}
    </div>
  );
}
