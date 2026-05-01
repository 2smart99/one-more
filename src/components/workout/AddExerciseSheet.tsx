'use client';

import { useEffect, useState } from 'react';
import { Exercise, MuscleGroup } from '@/types';
import { supabase } from '@/lib/supabase';
import { useWorkoutStore } from '@/store/workoutStore';
import { haptic } from '@/lib/telegram';

const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

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
    const { data } = await supabase
      .from('exercises')
      .insert({ user_id: userId, name: newName.trim(), muscle_group: newMuscle, is_custom: true })
      .select()
      .single();
    if (data) {
      setExercises((prev) => [...prev, data]);
      setNewName('');
      setShowAdd(false);
      haptic('success');
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
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-[32px] shadow-soft-xl flex flex-col max-h-[85vh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-extrabold text-text-primary">Aggiungi Esercizio</h2>
            <button onClick={onClose} className="text-text-secondary text-lg">✕</button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Cerca esercizio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm text-text-primary shadow-soft outline-none focus:ring-2 focus:ring-accent/30 mb-3"
          />

          {/* Muscle filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {(['All', ...MUSCLES] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFilter(m)}
                className={`shrink-0 rounded-pill px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === m
                    ? 'bg-accent text-white shadow-soft'
                    : 'bg-surface text-text-secondary shadow-soft'
                }`}
              >
                {m}
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
                className={`w-full flex items-center justify-between bg-surface rounded-2xl px-4 py-3 shadow-soft text-left transition-all active:scale-[0.98] ${
                  isActive ? 'opacity-40 cursor-default' : ''
                }`}
              >
                <div>
                  <p className="font-semibold text-text-primary text-sm">{ex.name}</p>
                  <p className="text-xs text-text-secondary">{ex.muscle_group}</p>
                </div>
                <span className="text-accent text-lg">{isActive ? '✓' : '+'}</span>
              </button>
            );
          })}

          {/* Create custom */}
          {!showAdd ? (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full bg-accent/10 text-accent rounded-2xl px-4 py-3 text-sm font-semibold border-2 border-dashed border-accent/30"
            >
              + Crea esercizio custom
            </button>
          ) : (
            <div className="bg-surface rounded-2xl p-4 shadow-soft space-y-3">
              <input
                type="text"
                placeholder="Nome esercizio"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-background rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30"
              />
              <div className="flex flex-wrap gap-2">
                {MUSCLES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setNewMuscle(m)}
                    className={`rounded-pill px-3 py-1 text-xs font-semibold transition-all ${
                      newMuscle === m ? 'bg-accent text-white' : 'bg-background text-text-secondary'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2 text-sm text-text-secondary rounded-xl bg-background">Annulla</button>
                <button onClick={handleCreateCustom} className="flex-1 py-2 text-sm text-white rounded-xl bg-accent font-semibold">Crea</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
