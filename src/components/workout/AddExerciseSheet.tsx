'use client';

import { useEffect, useState } from 'react';
import { Exercise, MuscleGroup, MUSCLE_LABELS } from '@/types';
import { supabase } from '@/lib/supabase';
import { useWorkoutStore } from '@/store/workoutStore';
import { haptic } from '@/lib/telegram';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

const MUSCLE_COLORS: Record<string, 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray'> = {
  Chest: 'blue', Back: 'green', Legs: 'orange', Shoulders: 'purple', Arms: 'red', Core: 'gray',
};

interface AddExerciseSheetProps {
  userId: number;
  onClose: () => void;
}

export function AddExerciseSheet({ userId, onClose }: AddExerciseSheetProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filter, setFilter] = useState<MuscleGroup | 'All'>('All');
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>('Chest');
  const [showAdd, setShowAdd] = useState(false);
  const { addExercise, exercises: activeExercises } = useWorkoutStore();
  const activeIds = new Set(activeExercises.map((e) => e.exercise.id));

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order('name');
      setExercises(data ?? []);
    }
    load();
  }, [userId]);

  async function handleCreateCustom() {
    if (!newName.trim()) return;
    try {
      const formData = new FormData();
      formData.append('user_id', String(userId));
      formData.append('name', newName.trim());
      formData.append('muscle_group', newMuscle);

      const res = await fetch('/api/exercises', { method: 'POST', body: formData });
      const json = await res.json();

      if (!res.ok) {
        console.error('[AddExerciseSheet] create error:', json);
        return;
      }
      if (json.data) {
        setExercises((prev) => [...prev, json.data]);
        setNewName('');
        setShowAdd(false);
        haptic('success');
      }
    } catch (err) {
      console.error('[AddExerciseSheet] network error:', err);
    }
  }

  const filtered = exercises.filter((e) => {
    const matchMuscle = filter === 'All' || e.muscle_group === filter;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    return matchMuscle && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-[28px] flex flex-col max-h-[85vh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-extrabold text-t1">Aggiungi Esercizio</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-surface-2 rounded-lg transition-colors text-t2"
              title="Chiudi"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Cerca esercizio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-t1 placeholder:text-t2 outline-none focus:ring-2 focus:ring-accent/30 mb-3"
          />

          {/* Muscle filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {(['All', ...MUSCLES] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFilter(m)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === m
                    ? 'bg-accent text-accent-fg'
                    : 'bg-surface-2 text-t2 border border-border'
                }`}
              >
                {m === 'All' ? 'Tutti' : MUSCLE_LABELS[m] ?? m}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
          {filtered.map((ex) => {
            const isActive = activeIds.has(ex.id);
            return (
              <button
                key={ex.id}
                disabled={isActive}
                onClick={() => {
                  addExercise(ex);
                  haptic('medium');
                  onClose();
                }}
                className={`w-full flex items-center justify-between bg-surface-2 border border-border rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.98] ${
                  isActive ? 'opacity-40 cursor-default' : ''
                }`}
              >
                <div>
                  <p className="font-semibold text-t1 text-sm">{ex.name}</p>
                  <Badge label={MUSCLE_LABELS[ex.muscle_group] ?? ex.muscle_group} color={MUSCLE_COLORS[ex.muscle_group] ?? 'gray'} />
                </div>
                {isActive ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="text-accent text-lg font-bold">+</span>
                )}
              </button>
            );
          })}

          {/* Create custom */}
          {!showAdd ? (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full bg-accent-light text-accent rounded-2xl px-4 py-3 text-sm font-semibold border-2 border-dashed border-accent/30"
            >
              + Crea esercizio custom
            </button>
          ) : (
            <div className="bg-surface-2 border border-border rounded-2xl p-4 space-y-4">
              <h3 className="font-bold text-t1 text-sm">Nuovo esercizio</h3>
              <input
                type="text"
                placeholder="Nome esercizio"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-t1 placeholder:text-t2 outline-none focus:ring-2 focus:ring-accent/30"
              />
              <div>
                <p className="text-[10px] text-t2 font-semibold uppercase tracking-wide mb-2">Categoria</p>
                <div className="flex flex-wrap gap-2">
                  {MUSCLES.map((m) => (
                    <button
                      key={m}
                      onClick={() => setNewMuscle(m)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border ${
                        newMuscle === m
                          ? 'bg-accent text-accent-fg border-accent'
                          : 'bg-surface text-t2 border-border'
                      }`}
                    >
                      {MUSCLE_LABELS[m] ?? m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 text-sm text-t2 rounded-xl bg-surface border border-border font-semibold"
                >
                  Annulla
                </button>
                <Button
                  onClick={handleCreateCustom}
                  disabled={!newName.trim()}
                  className="flex-1"
                >
                  Crea
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
