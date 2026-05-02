'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState } from 'react';
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

type RoutineExWithExercise = RoutineExercise & { exercise: Exercise };

export default function RoutineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useTelegram();
  const router = useRouter();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [routineExercises, setRoutineExercises] = useState<RoutineExWithExercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [showSheet, setShowSheet] = useState(false);
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'All'>('All');
  const [searchEx, setSearchEx] = useState('');

  // Debounce timer per il logging del progresso
  const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id || !user?.id) return;
    Promise.all([
      supabase.from('routines').select('*').eq('id', id).single(),
      supabase.from('routine_exercises').select('*, exercise:exercises(*)').eq('routine_id', id).order('sort_order'),
      supabase.from('exercises').select('*').or(`user_id.is.null,user_id.eq.${user.id}`).order('name'),
    ]).then(([routineRes, reRes, exRes]) => {
      if (routineRes.error) console.error('[routine load]', routineRes.error);
      if (reRes.error) console.error('[routine_exercises load]', reRes.error);
      if (exRes.error) console.error('[exercises load]', exRes.error);
      setRoutine(routineRes.data);
      setRoutineExercises((reRes.data ?? []) as RoutineExWithExercise[]);
      setAllExercises(exRes.data ?? []);
    });
  }, [id, user?.id]);

  // Log peso nel tracking progressi (debounced 800ms)
  const logWeightProgress = useCallback(
    (exercise_id: string, weight: number, reps: number, sets: number) => {
      if (!user?.id || weight <= 0) return;
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
      progressTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, exercise_id, weight, reps, sets }),
          });
          if (!res.ok) {
            const json = await res.json();
            console.error('[logWeightProgress] error:', json);
          }
        } catch (err) {
          console.error('[logWeightProgress] unexpected error:', err);
        }
      }, 800);
    },
    [user?.id]
  );

  async function addExerciseToRoutine(exercise: Exercise) {
    const nextOrder = routineExercises.length;
    try {
      const res = await fetch('/api/routine-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routine_id: id, exercise_id: exercise.id, sort_order: nextOrder }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error('[addExerciseToRoutine] error:', json);
        return;
      }
      setRoutineExercises((prev) => [...prev, json.data as RoutineExWithExercise]);
      haptic('medium');
    } catch (err) {
      console.error('[addExerciseToRoutine] unexpected error:', err);
    }
    setShowSheet(false);
  }

  async function removeExercise(reId: string) {
    try {
      const res = await fetch(`/api/routine-exercises/${reId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        console.error('[removeExercise] error:', json);
        return;
      }
      setRoutineExercises((prev) => prev.filter((re) => re.id !== reId));
      haptic('light');
    } catch (err) {
      console.error('[removeExercise] unexpected error:', err);
    }
  }

  async function updateDefaults(
    re: RoutineExWithExercise,
    field: 'default_sets' | 'default_reps' | 'default_weight',
    value: number
  ) {
    // Optimistic update
    setRoutineExercises((prev) =>
      prev.map((r) => r.id === re.id ? { ...r, [field]: value } : r)
    );

    try {
      const res = await fetch(`/api/routine-exercises/${re.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const json = await res.json();
        console.error('[updateDefaults] error:', json);
      }
    } catch (err) {
      console.error('[updateDefaults] unexpected error:', err);
    }

    // Track weight changes in progress log
    if (field === 'default_weight') {
      const updated = routineExercises.find((r) => r.id === re.id);
      const reps = updated?.default_reps ?? re.default_reps;
      const sets = updated?.default_sets ?? re.default_sets;
      logWeightProgress(re.exercise_id, value, reps, sets);
    }
  }

  async function moveExercise(reId: string, direction: 'up' | 'down') {
    const idx = routineExercises.findIndex((re) => re.id === reId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= routineExercises.length) return;

    const newList = [...routineExercises];
    [newList[idx], newList[newIdx]] = [newList[newIdx], newList[idx]];
    setRoutineExercises(newList);

    try {
      await Promise.all(
        newList.map((re, i) =>
          fetch(`/api/routine-exercises/${re.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sort_order: i }),
          })
        )
      );
    } catch (err) {
      console.error('[moveExercise] error:', err);
    }

    haptic('light');
  }

  if (!routine) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
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
    <div className="min-h-screen pb-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="px-4 space-y-4">
        <Header
          title={routine.title}
          subtitle={`${routineExercises.length} esercizi`}
          right={
            <button
              onClick={() => router.back()}
              className="text-sm font-semibold"
              style={{ color: 'var(--text-secondary)' }}
            >
              Indietro
            </button>
          }
        />

        {/* Exercise list */}
        {routineExercises.length === 0 && (
          <div
            className="rounded-2xl border-2 border-dashed p-8 text-center"
            style={{ border: '2px dashed var(--border)', background: 'var(--bg-secondary)' }}
          >
            <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Nessun esercizio</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Aggiungi esercizi a questa scheda
            </p>
          </div>
        )}

        <div className="space-y-3">
          {routineExercises.map((re, i) => (
            <Card key={re.id}>
              {/* Exercise header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-semibold mb-0.5" style={{ color: 'var(--text-secondary)' }}>
                    #{i + 1}
                  </p>
                  <p className="font-extrabold text-base" style={{ color: 'var(--text-primary)' }}>
                    {re.exercise.name}
                  </p>
                  <Badge label={re.exercise.muscle_group} color={MUSCLE_COLORS[re.exercise.muscle_group] ?? 'gray'} />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveExercise(re.id, 'up')}
                    disabled={i === 0}
                    className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-30 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveExercise(re.id, 'down')}
                    disabled={i === routineExercises.length - 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-30 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeExercise(re.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                    style={{ color: 'var(--danger)', opacity: 0.5 }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Default values: sets / reps / weight */}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Valori di partenza
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Serie
                    </p>
                    <NumberInput
                      value={re.default_sets}
                      onChange={(v) => updateDefaults(re, 'default_sets', v)}
                      step={1} min={1} max={10} size="sm"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Ripetizioni
                    </p>
                    <NumberInput
                      value={re.default_reps}
                      onChange={(v) => updateDefaults(re, 'default_reps', v)}
                      step={1} min={1} max={50} size="sm"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Peso
                    </p>
                    <NumberInput
                      value={re.default_weight}
                      onChange={(v) => updateDefaults(re, 'default_weight', v)}
                      step={2.5} suffix="kg" size="sm"
                    />
                  </div>
                </div>

                {/* Weight progress hint */}
                {re.default_weight > 0 && (
                  <p className="text-[10px] text-center" style={{ color: 'var(--accent-primary)' }}>
                    ● Il peso viene salvato nei progressi
                  </p>
                )}
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
      </div>

      {/* Exercise picker sheet */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={() => setShowSheet(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 flex flex-col"
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              maxHeight: '85vh',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--border)' }} />
            </div>
            <div className="px-5 pb-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  Scegli Esercizio
                </h2>
                <button
                  onClick={() => setShowSheet(false)}
                  className="text-lg w-8 h-8 flex items-center justify-center rounded-lg"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  ×
                </button>
              </div>
              <input
                type="text"
                placeholder="Cerca..."
                value={searchEx}
                onChange={(e) => setSearchEx(e.target.value)}
                className="input mb-3"
                style={{ borderRadius: 'var(--radius-md)' }}
              />
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {(['All', ...MUSCLES] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setFilterMuscle(m)}
                    className={`chip shrink-0 ${filterMuscle === m ? 'chip-active' : ''}`}
                  >
                    {m === 'All' ? 'Tutti' : m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
              {filteredAll.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => addExerciseToRoutine(ex)}
                  className="w-full flex items-center justify-between rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.98]"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {ex.name}
                    </p>
                    <Badge label={ex.muscle_group} color={MUSCLE_COLORS[ex.muscle_group] ?? 'gray'} />
                  </div>
                  <span className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>+</span>
                </button>
              ))}
              {filteredAll.length === 0 && (
                <p className="text-center text-sm py-8" style={{ color: 'var(--text-secondary)' }}>
                  Nessun esercizio disponibile
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
