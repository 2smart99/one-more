'use client';

import { Workout } from '@/types';
import { Card } from '@/components/ui/Card';
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        {/* Trophy */}
        <div className="text-center mb-2">
          <div className="text-6xl mb-2">🏆</div>
          <h1 className="text-3xl font-extrabold text-text-primary">Allenamento</h1>
          <h1 className="text-3xl font-extrabold text-accent">Completato!</h1>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Volume Totale', value: `${volume.toLocaleString()} kg`, icon: '🏋️', accent: true },
            { label: 'Durata', value: duration, icon: '⏱' },
            { label: 'Serie completate', value: String(totalSets), icon: '✅' },
            { label: 'Miglior 1RM', value: best1RM > 0 ? `${best1RM} kg` : '—', icon: '⚡' },
          ].map(({ label, value, icon, accent }) => (
            <Card key={label} className={`text-center ${accent ? 'border-2 border-accent/20' : ''}`}>
              <div className="text-2xl mb-1">{icon}</div>
              <div className={`text-xl font-extrabold ${accent ? 'text-accent' : 'text-text-primary'}`}>{value}</div>
              <div className="text-[10px] text-text-secondary font-medium mt-0.5">{label}</div>
            </Card>
          ))}
        </div>

        <Link href="/" className="block">
          <Button fullWidth size="lg">Torna alla Home</Button>
        </Link>
        <Link href="/history" className="block">
          <Button fullWidth size="md" variant="secondary">Vedi Progressi</Button>
        </Link>
      </div>
    </div>
  );
}
