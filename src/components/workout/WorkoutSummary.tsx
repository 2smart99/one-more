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
    : '-';

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top section */}
      <div className="px-6 pt-16 pb-12 text-center">
        <div className="w-20 h-20 bg-accent-light rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-t1 text-3xl font-extrabold tracking-tight">Ottimo lavoro!</h1>
        <p className="text-t2 text-sm mt-2 font-medium">Allenamento completato</p>
      </div>

      {/* Stats */}
      <div className="px-4 space-y-3 pb-8 flex-1">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Volume Totale', value: `${volume.toLocaleString()} kg`, highlight: true },
            { label: 'Durata', value: duration, highlight: false },
            { label: 'Serie completate', value: String(totalSets), highlight: false },
            { label: 'Miglior 1RM', value: best1RM > 0 ? `${best1RM} kg` : '-', highlight: false },
          ].map(({ label, value, highlight }) => (
            <div
              key={label}
              className={`rounded-2xl p-5 border ${
                highlight ? 'bg-accent border-accent/20 text-accent-fg' : 'bg-surface border-border'
              }`}
            >
              <div className={`text-2xl font-extrabold tracking-tight ${highlight ? 'text-accent-fg' : 'text-t1'}`}>
                {value}
              </div>
              <div className={`text-xs font-semibold mt-1 uppercase tracking-wider ${highlight ? 'text-accent-fg/70' : 'text-t2'}`}>
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
