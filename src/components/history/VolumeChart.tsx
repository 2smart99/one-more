'use client';

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';
import { VolumeDataPoint } from '@/types';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

interface VolumeChartProps {
  data: VolumeDataPoint[];
  title?: string;
  color?: string;
  type?: 'volume' | 'one_rm';
}

export function VolumeChart({ data, title = 'Volume', color = 'var(--accent)', type = 'volume' }: VolumeChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-t2 text-sm">
        Nessun dato disponibile
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), 'd MMM', { locale: it }),
    displayValue: type === 'volume' ? Math.round(d.volume / 1000 * 10) / 10 : d.volume,
  }));

  return (
    <div>
      {title && <h4 className="text-sm font-semibold text-t2 mb-2">{title}</h4>}
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={formatted} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={`grad-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--text-2)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-2)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 12,
              color: 'var(--text-1)',
            }}
            formatter={(val: number) => [type === 'volume' ? `${val}t` : `${val}kg`, title]}
            labelStyle={{ fontWeight: 700, color: 'var(--text-1)' }}
          />
          <Area
            type="monotone"
            dataKey="displayValue"
            stroke={color}
            strokeWidth={2.5}
            fill="url(#grad-area)"
            dot={false}
            activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
