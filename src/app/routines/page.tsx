'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/lib/supabase';
import { Routine } from '@/types';
import { haptic } from '@/lib/telegram';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const DAY_FULL  = ['Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato', 'Domenica'];

export default function RoutinesPage() {
  const { user } = useTelegram();
  const { showToast, Toast } = useToast();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [day, setDay] = useState<number | null>(null);
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
      .from('routines')
      .select('*, routine_exercises(count)')
      .eq('user_id', user.id)
      .order('day_of_week', { ascending: true, nullsFirst: false })
      .then(({ data }) => {
        setRoutines(data ?? []);
        setLoading(false);
      });
  }, [user?.id]);

  async function createRoutine() {
    if (!title.trim() || !user?.id) {
      showToast('Inserisci un nome per la scheda', 'error');
      return;
    }
    setCreating(true);
    try {
      await supabase.from('users').upsert({ tg_id: user.id, first_name: user.first_name, username: user.username });
      const { data, error } = await supabase
        .from('routines')
        .insert({ user_id: user.id, title: title.trim(), day_of_week: day })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setRoutines((prev) => [...prev, data]);
        setTitle('');
        setDay(null);
        setShowForm(false);
        showToast('Scheda creata ✓', 'success');
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

  async function deleteRoutine(id: string) {
    await supabase.from('routines').delete().eq('id', id);
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    haptic('light');
  }

  const byDay = new Map<number | null, Routine[]>();
  for (const r of routines) {
    const k = r.day_of_week ?? null;
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(r);
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg-primary)' }}>
      <Toast />

      {/* Header */}
      <div className="px-5 pt-8 pb-5 flex items-center justify-between">
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Le mie Schede
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {routines.length} {routines.length === 1 ? 'routine' : 'routine'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
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

        {/* Create form */}
        {showForm && (
          <div
            className="p-5 space-y-4 animate-slide-down"
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              Nuova Scheda
            </h3>

            <input
              type="text"
              placeholder="Nome scheda (es. Push Day)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={creating}
              className="input disabled:opacity-50"
            />

            <div>
              <p className="section-label mb-2">Giorno della settimana</p>
              <div className="flex flex-wrap gap-2">
                {DAY_NAMES.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => setDay(day === i ? null : i)}
                    disabled={creating}
                    className={`chip disabled:opacity-50 transition-all ${day === i ? 'chip-active' : ''}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="btn-secondary text-sm flex-1"
                onClick={() => setShowForm(false)}
                disabled={creating}
                style={{ padding: '10px 16px' }}
              >
                Annulla
              </button>
              <button
                className="btn-primary flex-1"
                onClick={createRoutine}
                disabled={!title.trim() || creating}
                style={{ padding: '10px 16px', fontSize: 14 }}
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Creazione...
                  </span>
                ) : 'Crea'}
              </button>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="px-5 py-5 animate-pulse"
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  height: 76,
                }}
              />
            ))}
          </div>
        ) : routines.length === 0 && !showForm ? (
          /* Empty state */
          <div
            className="p-12 text-center"
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '2px dashed var(--border)',
            }}
          >
            <div
              className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(200,241,53,0.1)', borderRadius: 'var(--radius-md)' }}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="var(--accent-primary)" strokeWidth={1.5}>
                <path d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Nessuna scheda</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Crea la tua prima routine di allenamento
            </p>
          </div>
        ) : (
          /* Grouped by day */
          Array.from(byDay.entries())
            .sort(([a], [b]) => (a ?? 99) - (b ?? 99))
            .map(([dayIdx, rs]) => (
              <section key={String(dayIdx)}>
                <p className="section-label px-1 mb-3">
                  {dayIdx !== null ? DAY_FULL[dayIdx] : 'Senza giorno fisso'}
                </p>
                <div className="space-y-3">
                  {rs.map((r) => {
                    const exCount = (r as { routine_exercises?: { count: number }[] }).routine_exercises?.[0]?.count ?? 0;
                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between overflow-hidden"
                        style={{
                          background: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          boxShadow: 'var(--shadow-card)',
                        }}
                      >
                        {/* Left accent bar */}
                        <div style={{ width: 4, alignSelf: 'stretch', background: 'var(--accent-primary)', flexShrink: 0 }} />

                        <Link href={`/routines/${r.id}`} className="flex-1 min-w-0 px-4 py-4">
                          <p className="font-extrabold truncate" style={{ color: 'var(--text-primary)' }}>
                            {r.title}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {exCount} esercizi
                          </p>
                        </Link>

                        <div className="flex items-center gap-2 pr-3 shrink-0">
                          <Link href={`/workout?routine=${r.id}`}>
                            <button
                              className="flex items-center justify-center"
                              style={{
                                width: 40,
                                height: 40,
                                background: 'var(--accent-primary)',
                                color: 'var(--text-on-accent)',
                                borderRadius: 'var(--radius-md)',
                                boxShadow: 'var(--shadow-accent)',
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                            </button>
                          </Link>
                          <button
                            onClick={() => deleteRoutine(r.id)}
                            className="flex items-center justify-center transition-all"
                            style={{
                              width: 40,
                              height: 40,
                              color: 'var(--danger)',
                              opacity: 0.5,
                              borderRadius: 'var(--radius-md)',
                              fontSize: 20,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
        )}
      </div>
    </div>
  );
}
