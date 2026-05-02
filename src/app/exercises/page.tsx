'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/lib/supabase';
import { Exercise, MuscleGroup } from '@/types';
import { haptic } from '@/lib/telegram';
import { useToast } from '@/hooks/useToast';

const MUSCLES: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

const MUSCLE_EMOJI: Record<string, string> = {
  Chest: '💪', Back: '🦾', Legs: '🦵', Shoulders: '🏋️', Arms: '💪', Core: '🔥',
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
    supabase.from('users').upsert({ tg_id: user.id, first_name: user.first_name, username: user.username }).then(() => {});
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
      showToast("Inserisci un nome per l'esercizio", 'error');
      return;
    }
    setCreating(true);
    try {
      await supabase.from('users').upsert({ tg_id: user.id, first_name: user.first_name, username: user.username });
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'riprova';
      showToast('Errore: ' + message, 'error');
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
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg-primary)' }}>
      <Toast />

      {/* Header */}
      <div className="px-5 pt-8 pb-5 flex items-center justify-between">
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Esercizi
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {exercises.length} disponibili
          </p>
        </div>
        <button
          onClick={() => setShowSheet(true)}
          className="btn-icon"
          style={{
            background: 'var(--accent-primary)',
            color: 'var(--text-on-accent)',
            width: 44,
            height: 44,
            fontSize: 22,
            fontWeight: 700,
            boxShadow: 'var(--shadow-accent)',
          }}
        >
          +
        </button>
      </div>

      <div className="px-4 space-y-4 pb-8">

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--text-secondary)' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Cerca esercizio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-11"
            style={{ borderRadius: 'var(--radius-pill)' }}
          />
        </div>

        {/* Muscle filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {(['All', ...MUSCLES] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`chip shrink-0 ${filter === m ? 'chip-active' : ''}`}
            >
              {m === 'All' ? 'Tutti' : m}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  height: 64,
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center justify-between group overflow-hidden"
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  borderLeft: '3px solid var(--accent-primary)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="flex items-center gap-3 px-4 py-3.5 flex-1 min-w-0">
                  <div
                    className="w-9 h-9 flex items-center justify-center shrink-0 text-base"
                    style={{
                      background: 'rgba(200,241,53,0.1)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {MUSCLE_EMOJI[ex.muscle_group] ?? '🏋️'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {ex.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {ex.muscle_group}
                      {ex.is_custom && (
                        <span
                          className="ml-2 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                          style={{
                            background: 'rgba(200,241,53,0.15)',
                            color: 'var(--accent-primary)',
                          }}
                        >
                          custom
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {ex.is_custom && (
                  <button
                    onClick={() => deleteCustom(ex.id)}
                    className="pr-4 opacity-0 group-hover:opacity-100 transition-opacity text-xl"
                    style={{ color: 'var(--danger)' }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Nessun esercizio trovato
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom sheet: nuovo esercizio */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => !creating && setShowSheet(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 animate-sheet-up"
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              border: '1px solid var(--border)',
              borderBottom: 'none',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--border)' }} />
            </div>

            <div className="px-5 pb-10 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-xl" style={{ color: 'var(--text-primary)' }}>
                  Nuovo Esercizio
                </h2>
                <button
                  onClick={() => !creating && setShowSheet(false)}
                  className="btn-icon"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div>
                <label className="section-label block mb-2">Nome esercizio</label>
                <input
                  type="text"
                  placeholder="Es. Panca Piana"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  disabled={creating}
                  className="input disabled:opacity-50"
                />
              </div>

              <div>
                <label className="section-label block mb-2">Gruppo muscolare</label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLES.map((m) => (
                    <button
                      key={m}
                      onClick={() => setNewMuscle(m)}
                      disabled={creating}
                      className={`chip disabled:opacity-50 ${newMuscle === m ? 'chip-active' : ''}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn-primary w-full disabled:opacity-50"
                onClick={createCustom}
                disabled={!newName.trim() || creating}
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Creazione...
                  </span>
                ) : 'Salva Esercizio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
