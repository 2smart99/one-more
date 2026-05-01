'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/lib/supabase';
import { Exercise, MuscleGroup } from '@/types';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { haptic } from '@/lib/telegram';

const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

export default function ExercisesPage() {
  const { user } = useTelegram();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filter, setFilter] = useState<MuscleGroup | 'All'>('All');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
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
      setShowForm(false);
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

  const MUSCLE_COLORS: Record<string, 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray'> = {
    Chest: 'blue', Back: 'green', Legs: 'orange', Shoulders: 'purple', Arms: 'red', Core: 'gray',
  };

  return (
    <div className="px-4 space-y-4">
      <Header
        title="Esercizi"
        subtitle="Catalogo e custom"
        right={
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-9 h-9 bg-accent text-white rounded-full flex items-center justify-center text-xl shadow-soft"
          >
            +
          </button>
        }
      />

      {/* Add custom form */}
      {showForm && (
        <div className="bg-surface rounded-card p-5 shadow-soft space-y-3">
          <h3 className="font-bold text-text-primary">Nuovo Esercizio Custom</h3>
          <input
            type="text"
            placeholder="Nome esercizio"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-background rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/30"
          />
          <div className="flex flex-wrap gap-2">
            {MUSCLES.map((m) => (
              <button
                key={m}
                onClick={() => setNewMuscle(m)}
                className={`rounded-pill px-3 py-1 text-xs font-semibold transition-all ${
                  newMuscle === m ? 'bg-accent text-white' : 'bg-background text-text-secondary shadow-soft'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm rounded-xl bg-background text-text-secondary font-semibold">Annulla</button>
            <button onClick={createCustom} className="flex-1 py-2.5 text-sm rounded-xl bg-accent text-white font-semibold shadow-soft">Crea</button>
          </div>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Cerca esercizio..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-surface rounded-xl px-4 py-2.5 text-sm shadow-soft outline-none focus:ring-2 focus:ring-accent/30"
      />

      {/* Muscle filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {(['All', ...MUSCLES] as const).map((m) => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className={`shrink-0 rounded-pill px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === m ? 'bg-accent text-white shadow-soft' : 'bg-surface text-text-secondary shadow-soft'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((ex) => (
          <div key={ex.id} className="bg-surface rounded-2xl px-4 py-3 shadow-soft flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold text-text-primary text-sm">{ex.name}</p>
                <Badge label={ex.muscle_group} color={MUSCLE_COLORS[ex.muscle_group] ?? 'gray'} />
              </div>
            </div>
            {ex.is_custom && (
              <button
                onClick={() => deleteCustom(ex.id)}
                className="text-danger/50 hover:text-danger text-lg transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
