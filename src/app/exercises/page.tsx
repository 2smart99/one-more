'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/lib/supabase';
import { Exercise, MuscleGroup } from '@/types';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { haptic } from '@/lib/telegram';

const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

const MUSCLE_COLORS: Record<string, 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray'> = {
  Chest: 'blue', Back: 'green', Legs: 'orange', Shoulders: 'purple', Arms: 'red', Core: 'gray',
};

export default function ExercisesPage() {
  const { user } = useTelegram();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filter, setFilter] = useState<MuscleGroup | 'All'>('All');
  const [search, setSearch] = useState('');
  const [showSheet, setShowSheet] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>('Chest');

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('exercises')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order('muscle_group')
      .order('name')
      .then(({ data }) => setExercises(data ?? []));
  }, [user?.id]);

  async function createCustom() {
    if (!newName.trim() || !user?.id) return;
    const { data } = await supabase
      .from('exercises')
      .insert({ user_id: user.id, name: newName.trim(), muscle_group: newMuscle, is_custom: true })
      .select()
      .single();
    if (data) {
      setExercises((prev) => [...prev, data]);
      setNewName('');
      setShowSheet(false);
      haptic('success');
    }
  }

  async function deleteCustom(id: string) {
    await supabase.from('exercises').delete().eq('id', id).eq('user_id', user!.id);
    setExercises((prev) => prev.filter((e) => e.id !== id));
    haptic('light');
  }

  const filtered = exercises.filter((e) => {
    const matchMuscle = filter === 'All' || e.muscle_group === filter;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    return matchMuscle && matchSearch;
  });

  return (
    <div className="px-4 space-y-4 pb-8">
      <Header
        title="Esercizi"
        subtitle="Catalogo e custom"
        right={
          <button
            onClick={() => setShowSheet(true)}
            className="w-9 h-9 bg-accent text-accent-fg rounded-xl flex items-center justify-center text-xl font-bold"
          >
            +
          </button>
        }
      />

      {/* Search */}
      <input
        type="text"
        placeholder="Cerca esercizio..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-t1 placeholder:text-t2 outline-none focus:ring-2 focus:ring-accent/30"
      />

      {/* Muscle filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
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
            {m}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((ex) => (
          <div
            key={ex.id}
            className="bg-surface rounded-2xl border border-border px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold text-t1 text-sm">{ex.name}</p>
                <Badge label={ex.muscle_group} color={MUSCLE_COLORS[ex.muscle_group] ?? 'gray'} />
              </div>
            </div>
            {ex.is_custom && (
              <button
                onClick={() => deleteCustom(ex.id)}
                className="text-danger/50 hover:text-danger text-lg transition-colors px-2"
              >
                x
              </button>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-t2 text-sm py-8">Nessun esercizio trovato</p>
        )}
      </div>

      {/* Create exercise bottom sheet */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSheet(false)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-[28px] flex flex-col">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-5 pb-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-t1">Nuovo Esercizio</h2>
                <button
                  onClick={() => setShowSheet(false)}
                  className="text-t2 text-lg font-bold w-8 h-8 flex items-center justify-center hover:bg-surface-2 rounded-lg transition-colors"
                >
                  x
                </button>
              </div>

              {/* Name input */}
              <div>
                <label className="text-xs font-bold text-t2 uppercase tracking-wide block mb-2">
                  Nome esercizio
                </label>
                <input
                  type="text"
                  placeholder="Es. Panca Piana"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-t1 placeholder:text-t2 outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* Category selector */}
              <div>
                <label className="text-xs font-bold text-t2 uppercase tracking-wide block mb-2">
                  Categoria
                </label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLES.map((m) => (
                    <button
                      key={m}
                      onClick={() => setNewMuscle(m)}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all border ${
                        newMuscle === m
                          ? 'bg-accent text-accent-fg border-accent'
                          : 'bg-surface-2 text-t2 border-border'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm button */}
              <Button
                fullWidth
                size="lg"
                onClick={createCustom}
                disabled={!newName.trim()}
              >
                Crea Esercizio
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
