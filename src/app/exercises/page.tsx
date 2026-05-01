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
import { useToast } from '@/hooks/useToast';

const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

const MUSCLE_COLORS: Record<string, 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray'> = {
  Chest: 'blue', Back: 'green', Legs: 'orange', Shoulders: 'purple', Arms: 'red', Core: 'gray',
};

export default function ExercisesPage() {
  const { user } = useTelegram();
  const { showToast, Toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filter, setFilter] = useState<MuscleGroup | 'All'>('All');
  const [search, setSearch] = useState('');
  const [showSheet, setShowSheet] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>('Chest');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('users')
      .upsert({ tg_id: user.id, first_name: user.first_name, username: user.username })
      .then(() => {});
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    supabase
      .from('exercises')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order('muscle_group')
      .order('name')
      .then(({ data }) => {
        setExercises(data ?? []);
        setLoading(false);
      });
  }, [user?.id]);

  async function createCustom() {
    if (!newName.trim() || !user?.id) {
      showToast('Inserisci un nome per l\'esercizio', 'error');
      return;
    }

    setCreating(true);

    try {
      await supabase
        .from('users')
        .upsert({ tg_id: user.id, first_name: user.first_name, username: user.username });

      const { data, error } = await supabase
        .from('exercises')
        .insert({ user_id: user.id, name: newName.trim(), muscle_group: newMuscle, is_custom: true })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setExercises((prev) => [...prev, data]);
        setNewName('');
        setShowSheet(false);
        showToast('Esercizio creato ✓', 'success');
        haptic('success');
      }
    } catch (err: any) {
      console.error('Error creating exercise:', err);
      showToast('Errore: ' + (err.message || 'riprova'), 'error');
      haptic('error');
    } finally {
      setCreating(false);
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
    <div className="min-h-screen bg-bg pb-24">
      <Toast />
      <div className="px-4 space-y-4 pb-8">
        <Header
          title="Esercizi"
          subtitle={`${exercises.length} disponibili`}
          right={
            <button
              onClick={() => setShowSheet(true)}
              className="w-10 h-10 bg-accent text-accent-fg rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg shadow-accent/20 active:scale-95 transition-transform"
            >
              +
            </button>
          }
        />

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-t2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Cerca esercizio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-2xl pl-11 pr-4 py-3 text-sm text-t1 placeholder:text-t2/60 outline-none focus:ring-2 focus:ring-accent/30 transition-all"
          />
        </div>

        {/* Muscle filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {(['All', ...MUSCLES] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                filter === m
                  ? 'bg-accent text-accent-fg shadow-lg shadow-accent/20'
                  : 'bg-surface text-t2 border border-border hover:border-accent/30'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface rounded-2xl border border-border px-4 py-4 animate-pulse">
                <div className="h-4 bg-surface-2 rounded w-32 mb-2" />
                <div className="h-3 bg-surface-2 rounded w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((ex) => (
              <div
                key={ex.id}
                className="bg-surface rounded-2xl border border-border px-4 py-3.5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-accent-light flex items-center justify-center text-accent text-xs font-bold">
                    {ex.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-t1 text-sm">{ex.name}</p>
                    <Badge label={ex.muscle_group} color={MUSCLE_COLORS[ex.muscle_group] ?? 'gray'} />
                  </div>
                </div>
                {ex.is_custom && (
                  <button
                    onClick={() => deleteCustom(ex.id)}
                    className="opacity-0 group-hover:opacity-100 text-danger/50 hover:text-danger text-lg transition-all px-2"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-t2 text-sm">Nessun esercizio trovato</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create exercise bottom sheet */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !creating && setShowSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-[28px] flex flex-col">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-5 pb-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-t1">Nuovo Esercizio</h2>
                <button
                  onClick={() => !creating && setShowSheet(false)}
                  className="text-t2 text-lg font-bold w-8 h-8 flex items-center justify-center hover:bg-surface-2 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>

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
                  disabled={creating}
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-t1 placeholder:text-t2/60 outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-t2 uppercase tracking-wide block mb-2">
                  Categoria
                </label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLES.map((m) => (
                    <button
                      key={m}
                      onClick={() => setNewMuscle(m)}
                      disabled={creating}
                      className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all border disabled:opacity-50 ${
                        newMuscle === m
                          ? 'bg-accent text-accent-fg border-accent shadow-lg shadow-accent/20'
                          : 'bg-surface-2 text-t2 border-border hover:border-accent/30'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                fullWidth
                size="lg"
                onClick={createCustom}
                disabled={!newName.trim() || creating}
                loading={creating}
              >
                {creating ? 'Creazione...' : 'Crea Esercizio'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
