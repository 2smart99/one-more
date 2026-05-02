'use client';

import { ExerciseHistory } from '@/types';
import { VolumeChart } from './VolumeChart';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

interface PRCardProps {
  history: ExerciseHistory;
}

export function PRCard({ history }: PRCardProps) {
  const lastDate = history.last_performed
    ? format(parseISO(history.last_performed), 'd MMM yyyy', { locale: it })
    : 'Mai';

  return (
    <div
      className="overflow-hidden"
      style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Accent top bar */}
      <div style={{ height: 3, background: 'var(--accent-primary)' }} />

      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-extrabold" style={{ color: 'var(--text-primary)', fontSize: 17 }}>
              {history.exercise_name}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Ultima volta: {lastDate}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>1RM Est.</p>
            <p
              className="font-extrabold font-stat"
              style={{ color: 'var(--accent-primary)', fontSize: 22 }}
            >
              {history.best_1rm} <span className="text-sm font-bold">kg</span>
            </p>
          </div>
        </div>

        {/* Stat row */}
        <div className="flex gap-3">
          <div
            className="flex-1 p-3 text-center"
            style={{
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Best Volume</p>
            <p className="font-extrabold font-stat" style={{ color: 'var(--text-primary)' }}>
              {(history.best_volume / 1000).toFixed(1)}t
            </p>
          </div>
          <div
            className="flex-1 p-3 text-center"
            style={{
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Sessioni</p>
            <p className="font-extrabold font-stat" style={{ color: 'var(--text-primary)' }}>
              {history.volume_trend.length}
            </p>
          </div>
        </div>

        {/* Charts */}
        {history.one_rm_trend.length > 1 && (
          <VolumeChart
            data={history.one_rm_trend}
            title="Progressione 1RM"
            color="var(--accent-primary)"
            type="one_rm"
          />
        )}
        {history.volume_trend.length > 1 && (
          <VolumeChart
            data={history.volume_trend}
            title="Volume per sessione"
            color="var(--accent-secondary)"
            type="volume"
          />
        )}
      </div>
    </div>
  );
}
