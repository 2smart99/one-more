'use client';

import { Workout } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatDistanceStrict } from 'date-fns';
import { it } from 'date-fns/locale';
import Link from 'next/link';

interface WorkoutSummaryProps {
  workout: Workout;
  volume: number;
  best1RM: number;
  totalSets: number;
}

export function WorkoutSummary({ workout, volume, best1RM, totalSets }: WorkoutSummaryProps) {
  const duration = workout.end_time
    ? formatDistanceStrict(new Date(workout.start_time), new Date(workout.end_time), { locale: it })
    : '—';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="hero-gradient px-6 pt-16 pb-12 text-center">
        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-white text-3xl font-extrabold tracking-tight">Ottimo lavoro!</h1>
        <p className="text-blue-200 text-sm mt-2 font-medium">Allenamento completato</p>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-6 space-y-3 pb-8 flex-1">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Volume Totale', value: `${volume.toLocaleString()} kg`, highlight: true },
            { label: 'Durata', value: duration },
            { label: 'Serie completate', value: String(totalSets) },
            { label: 'Miglior 1RM', value: best1RM > 0 ? `${best1RM} kg` : '—' },
          ].map(({ label, value, highlight }) => (
            <div
              key={label}
              className={`rounded-card p-5 border ${highlight ? 'bg-accent border-accent/20 text-white' : 'bg-surface border-border'}`}
            >
              <div className={`text-2xl font-extrabold tracking-tight ${highlight ? 'text-white' : 'text-text-primary'}`}>
                {value}
              </div>
              <div className={`text-xs font-semibold mt-1 uppercase tracking-wider ${highlight ? 'text-blue-100' : 'text-text-muted'}`}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <Link href="/" className="block pt-2">
          <Button fullWidth size="lg" variant="dark">Torna alla Home</Button>
        </Link>
        <Link href="/history" className="block">
          <Button fullWidth size="md" variant="secondary">Vedi i progressi</Button>
        </Link>
      </div>
    </div>
  );
}
