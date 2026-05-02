'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Routine } from '@/types';

const DAY_NAMES = ['Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato', 'Domenica'];

interface DayScheduleProps {
  userId: number;
}

export function DaySchedule({ userId }: DayScheduleProps) {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);

  const todayIndex = (new Date().getDay() + 6) % 7;
  const todayName = DAY_NAMES[todayIndex];

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('routines')
        .select('*, routine_exercises(*, exercise:exercises(*))')
        .eq('user_id', userId)
        .eq('day_of_week', todayIndex)
        .maybeSingle();
      setRoutine(data);
      setLoading(false);
    }
    load();
  }, [userId, todayIndex]);

  if (loading) {
    return (
      <div
        className="mx-4 animate-pulse"
        style={{
          height: 160,
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}
      />
    );
  }

  if (!routine) {
    return (
      <div
        className="mx-4 p-6 text-center"
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '2px dashed var(--border)',
        }}
      >
        <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
          Nessuna scheda per {todayName}
        </p>
        <Link href="/routines">
          <button className="btn-secondary text-sm px-5 py-2.5">
            Crea scheda per oggi
          </button>
        </Link>
      </div>
    );
  }

  const exercises = (routine.routine_exercises ?? []).sort((a, b) => a.sort_order - b.sort_order);
  const muscleGroups = [...new Set(exercises.map((re) => re.exercise?.muscle_group).filter(Boolean))];

  return (
    <div
      className="mx-4 overflow-hidden"
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Accent bar top */}
      <div style={{ height: 3, background: 'var(--accent-primary)', borderRadius: '24px 24px 0 0' }} />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between">
        <div>
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-0.5 mb-2"
            style={{
              background: 'rgba(200,241,53,0.15)',
              color: 'var(--accent-primary)',
            }}
          >
            {todayName}
          </span>
          <h2 className="font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', fontSize: 20 }}>
            {routine.title}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {exercises.length} esercizi
          </p>
        </div>
      </div>

      {/* Muscle group chips */}
      {muscleGroups.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1.5">
          {muscleGroups.slice(0, 4).map((m) => (
            <span
              key={m as string}
              className="text-xs font-semibold rounded-lg px-2 py-0.5"
              style={{
                background: 'rgba(200,241,53,0.1)',
                color: 'var(--accent-primary)',
              }}
            >
              {m as string}
            </span>
          ))}
        </div>
      )}

      {/* Exercise list */}
      {exercises.length > 0 && (
        <div className="px-5 pb-4 space-y-2">
          <p className="section-label mb-2">Sequenza esercizi</p>
          <div className="space-y-2">
            {exercises.map((re, i) => (
              <div key={re.id} className="flex items-center gap-3">
                <span
                  className="w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0"
                  style={{
                    background: 'rgba(200,241,53,0.15)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                  {re.exercise?.name}
                </span>
                <span
                  className="text-[11px] font-semibold shrink-0"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {re.default_sets}×{re.default_reps}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="px-5 pb-5">
        <Link href={`/workout?routine=${routine.id}`}>
          <button className="btn-primary w-full">
            ▶ Inizia Allenamento
          </button>
        </Link>
      </div>
    </div>
  );
}
