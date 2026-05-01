'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { useWorkoutActions } from '@/hooks/useWorkout';
import { supabase } from '@/lib/supabase';
import { Routine } from '@/types';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

function WorkoutStartContent() {
  const { user } = useTelegram();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preRoutineId = searchParams.get('routine');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(false);
  const { createWorkout } = useWorkoutActions(user?.id ?? 0);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('routines')
      .select('*, routine_exercises(count)')
      .eq('user_id', user.id)
      .order('day_of_week', { ascending: true, nullsFirst: false })
      .then(({ data }) => setRoutines(data ?? []));
  }, [user?.id]);

  async function start(routineId?: string) {
    if (!user?.id) return;
    setLoading(true);
    const id = await createWorkout(routineId);
    if (id) router.push(`/workout/${id}`);
    setLoading(false);
  }

  useEffect(() => {
    if (preRoutineId && user?.id) start(preRoutineId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preRoutineId, user?.id]);

  const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <div className="px-4 space-y-5">
      <Header title="Inizia Workout" subtitle="Scegli una scheda per cominciare" />

      {routines.length === 0 && !loading && (
        <div className="bg-surface rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <p className="text-t1 font-bold mb-1">Nessuna scheda trovata</p>
          <p className="text-t2 text-sm mb-4">Crea prima una scheda di allenamento</p>
          <Link href="/routines">
            <Button variant="secondary" size="sm">Vai alle schede</Button>
          </Link>
        </div>
      )}

      {routines.length > 0 && (
        <div className="space-y-3">
          {routines.map((r) => {
            const exCount = (r as { routine_exercises?: { count: number }[] }).routine_exercises?.[0]?.count ?? 0;
            const dayLabel = r.day_of_week !== undefined && r.day_of_week !== null
              ? DAY_NAMES[r.day_of_week]
              : null;

            return (
              <button
                key={r.id}
                onClick={() => start(r.id)}
                disabled={loading}
                className="w-full text-left bg-surface border border-border rounded-2xl px-5 py-4 flex items-center justify-between active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                <div>
                  <p className="font-extrabold text-t1">{r.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {dayLabel && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-accent-light text-accent rounded-lg px-2 py-0.5">
                        {dayLabel}
                      </span>
                    )}
                    <span className="text-t2 text-xs">{exCount} esercizi</span>
                  </div>
                </div>
                <span className="text-accent font-bold text-lg">
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin inline-block" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense>
      <WorkoutStartContent />
    </Suspense>
  );
}
