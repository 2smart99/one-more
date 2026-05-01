'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/lib/supabase';
import { Routine } from '@/types';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { haptic } from '@/lib/telegram';

const DAY_NAMES = ['Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato', 'Domenica'];

export default function RoutinesPage() {
  const { user } = useTelegram();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [day, setDay] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('users')
      .upsert({ tg_id: user.id, first_name: user.first_name, username: user.username })
      .then(() => {});
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('routines')
      .select('*, routine_exercises(count)')
      .eq('user_id', user.id)
      .order('day_of_week', { ascending: true, nullsFirst: false })
      .then(({ data }) => setRoutines(data ?? []));
  }, [user?.id]);

  async function createRoutine() {
    if (!title.trim() || !user?.id) return;
    const { data } = await supabase
      .from('routines')
      .insert({ user_id: user.id, title: title.trim(), day_of_week: day })
      .select()
      .single();
    if (data) {
      setRoutines((prev) => [...prev, data]);
      setTitle('');
      setDay(null);
      setShowForm(false);
      haptic('success');
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
    <div className="px-4 space-y-4 pb-8">
      <Header
        title="Schede"
        subtitle="Gestisci le tue routine"
        right={
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-9 h-9 bg-accent text-accent-fg rounded-xl flex items-center justify-center text-xl font-bold"
          >
            +
          </button>
        }
      />

      {showForm && (
        <Card>
          <h3 className="font-bold text-t1 mb-3">Nuova Scheda</h3>
          <input
            type="text"
            placeholder="Nome scheda (es. Push Day)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-t1 placeholder:text-t2 outline-none focus:ring-2 focus:ring-accent/30 mb-3"
          />
          <p className="text-xs text-t2 mb-2 font-semibold">Giorno della settimana (opzionale)</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {DAY_NAMES.map((name, i) => (
              <button
                key={i}
                onClick={() => setDay(day === i ? null : i)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all border ${
                  day === i
                    ? 'bg-accent text-accent-fg border-accent'
                    : 'bg-surface-2 text-t2 border-border'
                }`}
              >
                {name.slice(0, 3)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Annulla</Button>
            <Button size="sm" onClick={createRoutine} disabled={!title.trim()}>Crea</Button>
          </div>
        </Card>
      )}

      {routines.length === 0 && !showForm && (
        <div className="bg-surface rounded-2xl border-2 border-dashed border-border p-10 text-center">
          <p className="text-t1 font-bold mb-1">Nessuna scheda</p>
          <p className="text-t2 text-sm">Crea la tua prima routine di allenamento</p>
        </div>
      )}

      {/* Grouped by day */}
      {Array.from(byDay.entries())
        .sort(([a], [b]) => (a ?? 99) - (b ?? 99))
        .map(([dayIdx, rs]) => (
          <section key={String(dayIdx)}>
            <h2 className="text-[11px] font-bold text-t2 uppercase tracking-widest px-1 mb-2">
              {dayIdx !== null ? DAY_NAMES[dayIdx] : 'Senza giorno fisso'}
            </h2>
            <div className="space-y-3">
              {rs.map((r) => {
                const exCount = (r as { routine_exercises?: { count: number }[] }).routine_exercises?.[0]?.count ?? 0;
                return (
                  <Card key={r.id} className="flex items-center justify-between">
                    <Link href={`/routines/${r.id}`} className="flex-1 min-w-0 pr-3">
                      <p className="font-extrabold text-t1 truncate">{r.title}</p>
                      <p className="text-t2 text-xs mt-0.5">{exCount} esercizi</p>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/workout?routine=${r.id}`}>
                        <button className="w-9 h-9 bg-accent text-accent-fg rounded-xl flex items-center justify-center text-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </button>
                      </Link>
                      <button
                        onClick={() => deleteRoutine(r.id)}
                        className="w-9 h-9 text-danger/50 hover:text-danger rounded-xl hover:bg-danger/10 flex items-center justify-center transition-all"
                      >
                        x
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
    </div>
  );
}
