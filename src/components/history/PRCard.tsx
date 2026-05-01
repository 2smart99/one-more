'use client';

import { ExerciseHistory } from '@/types';
import { Card } from '@/components/ui/Card';
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
    <Card className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-extrabold text-text-primary">{history.exercise_name}</h3>
          <p className="text-xs text-text-secondary">Ultima volta: {lastDate}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-secondary">1RM Est.</p>
          <p className="text-xl font-extrabold text-accent">{history.best_1rm} kg</p>
        </div>
      </div>

      {/* Mini stat row */}
      <div className="flex gap-3">
        <div className="flex-1 bg-background rounded-2xl p-3 text-center shadow-soft">
          <p className="text-xs text-text-secondary">Best Volume</p>
          <p className="font-extrabold text-text-primary">{(history.best_volume / 1000).toFixed(1)}t</p>
        </div>
        <div className="flex-1 bg-background rounded-2xl p-3 text-center shadow-soft">
          <p className="text-xs text-text-secondary">Sessioni</p>
          <p className="font-extrabold text-text-primary">{history.volume_trend.length}</p>
        </div>
      </div>

      {/* Trend charts */}
      {history.one_rm_trend.length > 1 && (
        <VolumeChart
          data={history.one_rm_trend}
          title="Progressione 1RM"
          color="#68D391"
          type="one_rm"
        />
      )}
      {history.volume_trend.length > 1 && (
        <VolumeChart
          data={history.volume_trend}
          title="Volume per sessione"
          color="#78BCEE"
          type="volume"
        />
      )}
    </Card>
  );
}
