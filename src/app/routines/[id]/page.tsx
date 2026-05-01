'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/lib/supabase';
import { Exercise, MuscleGroup, Routine, RoutineExercise } from '@/types';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { NumberInput } from '@/components/ui/NumberInput';
import { haptic } from '@/lib/telegram';

const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
const MUSCLE_COLORS: Record<string, 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray'> = {
  Chest: 'blue', Back: 'green', Legs: 'orange', Shoulders: 'purple', Arms: 'red', Core: 'gray',
};

export default function RoutineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useTelegram();
  const router = useRouter();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [routineExercises, setRoutineExercises] = useState<(RoutineExercise & { exercise: Exercise })[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [showSheet, setShowSheet] = useState(false);
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'All'>('All');
  const [searchEx, setSearchEx] = useState('');

  useEffect(() => {
    if (!id || !user?.id) return;
    Promise.all([
      supabase.from('routines').select('*').eq('id', id).single(),
      supabase.from('routine_exercises').select('*, exercise:exercises(*)').eq('routine_id', id).order('sort_order'),
      supabase.from('exercises').select('*').or(`user_id.is.null,user_id.eq.${user.id}`).order('name'),
    ]).then(([routineRes, reRes, exRes]) => {
      setRoutine(routineRes.data);
      setRoutineExercises(reRes.data ?? []);
      setAllExercises(exRes.data ?? []);
    });
  }, [id, user?.id]);

  async function addExerciseToRoutine(exercise: Exercise) {
    const nextOrder = routineExercises.length;
    const { data } = await supabase
      .from('routine_exercises')
      .insert({ routine_id: id, exercise_id: exercise.id, sort_order: nextOrder })
      .select('*, exercise:exercises(*)')
      .single();
    if (data) {
      setRoutineExercises((prev) => [...prev, data]);
      haptic('medium');
    }
    setShowSheet(false);
  }

  async function removeExercise(reId: string) {
    await supabase.from('routine_exercises').delete().eq('id', reId);
    setRoutineExercises((prev) => prev.filter((re) => re.id !== reId));
    haptic('light');
  }

  async function updateDefaults(reId: string, field: 'default_sets' | 'default_reps' | 'default_weight', value: number) {
    await supabase.from('routine_exercises').update({ [field]: value }).eq('id', reId);
    setRoutineExercises((prev) =>
      prev.map((re) => re.id === reId ? { ...re, [field]: value } : re)
    );
  }

  if (!routine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeIds = new Set(routineExercises.map((re) => re.exercise_id));
  const filteredAll = allExercises.filter((e) => {
    const notAdded = !activeIds.has(e.id);
    const matchMuscle = filterMuscle === 'All' || e.muscle_group === filterMuscle;
    const matchSearch = e.name.toLowerCase().includes(searchEx.toLowerCase());
    return notAdded && matchMuscle && matchSearch;
  });

  return (
    <div className="px-4 space-y-4 pb-8">
      <Header
        title={routine.title}
        subtitle={`${routineExercises.length} esercizi`}
        right={
          <button
            onClick={() => router.back()}
            className="text-t2 text-sm font-semibold hover:text-t1 transition-colors"
          >
            Indietro
          </button>
        }
      />

      {/* Exercise list */}
      {routineExercises.length === 0 && (
        <div className="bg-surface rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <p className="text-t1 font-bold mb-1">Nessun esercizio</p>
          <p className="text-t2 text-sm">Aggiungi esercizi a questa scheda</p>
        </div>
      )}

      <div className="space-y-3">
        {routineExercises.map((re, i) => (
          <Card key={re.id}>
            {/* Exercise header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] text-t2 font-semibold mb-0.5">#{i + 1}</p>
                <p className="font-extrabold text-t1 text-base">{re.exercise.name}</p>
                <Badge label={re.exercise.muscle_group} color={MUSCLE_COLORS[re.exercise.muscle_group] ?? 'gray'} />
              </div>
              <button
                onClick={() => removeExercise(re.id)}
                className="text-danger/40 hover:text-danger transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-danger/10"
              >
                x
              </button>
            </div>

            {/* Progress inputs */}
            <div className="space-y-3">
              <p className="text-[10px] text-t2 font-semibold uppercase tracking-wide">
                Punto di partenza per questo esercizio
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-[10px] text-t2 font-semibold uppercase tracking-wide mb-2">Serie</p>
                  <NumberInput
                    value={re.default_sets}
                    onChange={(v) => updateDefaults(re.id, 'default_sets', v)}
                    step={1}
                    min={1}
                    max={10}
                    size="sm"
                  />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-t2 font-semibold uppercase tracking-wide mb-2">Rip</p>
                  <NumberInput
                    value={re.default_reps}
                    onChange={(v) => updateDefaults(re.id, 'default_reps', v)}
                    step={1}
                    min={1}
                    max={50}
                    size="sm"
                  />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-t2 font-semibold uppercase tracking-wide mb-2">Peso</p>
                  <NumberInput
                    value={re.default_weight}
                    onChange={(v) => updateDefaults(re.id, 'default_weight', v)}
                    step={2.5}
                    suffix="kg"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button fullWidth variant="secondary" onClick={() => setShowSheet(true)}>
        + Aggiungi Esercizio
      </Button>

      <Button fullWidth size="lg" onClick={() => router.push(`/workout?routine=${id}`)}>
        Inizia con questa scheda
      </Button>

      {/* Exercise picker sheet */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-[28px] flex flex-col max-h-[85vh]">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="px-5 pb-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-extrabold text-t1">Scegli Esercizio</h2>
                <button
                  onClick={() => setShowSheet(false)}
                  className="text-t2 text-lg w-8 h-8 flex items-center justify-center hover:bg-surface-2 rounded-lg transition-colors"
                >
                  x
                </button>
              </div>
              <input
                type="text"
                placeholder="Cerca..."
                value={searchEx}
                onChange={(e) => setSearchEx(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-t1 placeholder:text-t2 outline-none focus:ring-2 focus:ring-accent/30 mb-3"
              />
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {(['All', ...MUSCLES] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setFilterMuscle(m)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      filterMuscle === m
                        ? 'bg-accent text-accent-fg'
                        : 'bg-surface-2 text-t2 border border-border'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
              {filteredAll.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => addExerciseToRoutine(ex)}
                  className="w-full flex items-center justify-between bg-surface-2 border border-border rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.98]"
                >
                  <div>
                    <p className="font-semibold text-t1 text-sm">{ex.name}</p>
                    <Badge label={ex.muscle_group} color={MUSCLE_COLORS[ex.muscle_group] ?? 'gray'} />
                  </div>
                  <span className="text-accent text-lg font-bold">+</span>
                </button>
              ))}
              {filteredAll.length === 0 && (
                <p className="text-center text-t2 text-sm py-8">Nessun esercizio disponibile</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
