'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/lib/supabase';
import { Routine } from '@/types';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { haptic } from '@/lib/telegram';
import { useToast } from '@/hooks/useToast';

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const DAY_FULL = ['Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato', 'Domenica'];

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
    supabase
      .from('users')
      .upsert({ tg_id: user.id, first_name: user.first_name, username: user.username })
      .then(() => {});
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
      await supabase
        .from('users')
        .upsert({ tg_id: user.id, first_name: user.first_name, username: user.username });

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
    } catch (err: any) {
      console.error('Error creating routine:', err);
      showToast('Errore: ' + (err.message || 'riprova'), 'error');
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

  // Group by day
  const byDay = new Map<number | null, Routine[]>();
  for (const r of routines) {
    const k = r.day_of_week ?? null;
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(r);
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Toast />
      <div className="px-4 space-y-4 pb-8">
        <Header
          title="Schede"
          subtitle={`${routines.length} routine`}
          right={
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-10 h-10 bg-accent text-accent-fg rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg shadow-accent/20 active:scale-95 transition-transform"
            >
              +
            </button>
          }
        />

        {showForm && (
          <div className="bg-surface rounded-3xl border border-border p-5 space-y-4 animate-slide-down">
            <h3 className="font-bold text-t1 text-lg">Nuova Scheda</h3>
            <input
              type="text"
              placeholder="Nome scheda (es. Push Day)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={creating}
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-t1 placeholder:text-t2/60 outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
            />
            <div>
              <p className="text-xs text-t2 mb-2 font-semibold">Giorno della settimana</p>
              <div className="flex flex-wrap gap-2">
                {DAY_NAMES.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => setDay(day === i ? null : i)}
                    disabled={creating}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all border disabled:opacity-50 ${
                      day === i
                        ? 'bg-accent text-accent-fg border-accent shadow-lg shadow-accent/20'
                        : 'bg-surface-2 text-t2 border-border hover:border-accent/30'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)} disabled={creating}>Annulla</Button>
              <Button size="sm" onClick={createRoutine} disabled={!title.trim() || creating} loading={creating}>
                {creating ? 'Creazione...' : 'Crea'}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-surface rounded-2xl border border-border px-5 py-5 animate-pulse">
                <div className="h-5 bg-surface-2 rounded w-32 mb-2" />
                <div className="h-3 bg-surface-2 rounded w-20" />
              </div>
            ))}
          </div>
        ) : routines.length === 0 && !showForm ? (
          <div className="bg-surface rounded-3xl border-2 border-dashed border-border p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-light flex items-center justify-center">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <p className="text-t1 font-bold mb-1">Nessuna scheda</p>
            <p className="text-t2 text-sm">Crea la tua prima routine di allenamento</p>
          </div>
        ) : (
          /* Grouped by day */
          Array.from(byDay.entries())
            .sort(([a], [b]) => (a ?? 99) - (b ?? 99))
            .map(([dayIdx, rs]) => (
              <section key={String(dayIdx)}>
                <h2 className="text-[11px] font-bold text-t2 uppercase tracking-widest px-1 mb-3">
                  {dayIdx !== null ? DAY_FULL[dayIdx] : 'Senza giorno fisso'}
                </h2>
                <div className="space-y-3">
                  {rs.map((r) => {
                    const exCount = (r as { routine_exercises?: { count: number }[] }).routine_exercises?.[0]?.count ?? 0;
                    return (
                      <div key={r.id} className="bg-surface rounded-2xl border border-border px-5 py-4 flex items-center justify-between group">
                        <Link href={`/routines/${r.id}`} className="flex-1 min-w-0 pr-3">
                          <p className="font-extrabold text-t1 truncate">{r.title}</p>
                          <p className="text-t2 text-xs mt-0.5">{exCount} esercizi</p>
                        </Link>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link href={`/workout?routine=${r.id}`}>
                            <button className="w-10 h-10 bg-accent text-accent-fg rounded-xl flex items-center justify-center text-sm shadow-lg shadow-accent/20 active:scale-95 transition-transform">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                            </button>
                          </Link>
                          <button
                            onClick={() => deleteRoutine(r.id)}
                            className="w-10 h-10 text-danger/40 hover:text-danger rounded-xl hover:bg-danger/10 flex items-center justify-center transition-all"
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
