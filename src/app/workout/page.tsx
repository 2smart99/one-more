'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { useWorkoutActions } from '@/hooks/useWorkout';
import { supabase } from '@/lib/supabase';
import { Routine } from '@/types';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

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
    <div className="px-4 space-y-4">
      <Header title="Inizia Workout" subtitle="Scegli un modello o parti libero" />

      <Button fullWidth size="lg" loading={loading} onClick={() => start()}>
        + Sessione Libera
      </Button>

      {routines.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide px-1 mb-2">
            Le tue schede
          </h2>
          <div className="space-y-3">
            {routines.map((r) => (
              <Card key={r.id} onClick={() => start(r.id)} className="flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-text-primary">{r.title}</p>
                  {r.day_of_week !== undefined && r.day_of_week !== null && (
                    <Badge label={DAY_NAMES[r.day_of_week]} color="blue" />
                  )}
                </div>
                <span className="text-accent text-2xl">▶</span>
              </Card>
            ))}
          </div>
        </section>
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
