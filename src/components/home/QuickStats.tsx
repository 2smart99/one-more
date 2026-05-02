'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { startOfMonth, format } from 'date-fns';

interface QuickStatsProps {
  userId: number;
}

interface Stats {
  weekSessions: number;
  totalSessions: number;
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconActivity() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function QuickStats({ userId }: QuickStatsProps) {
  const [stats, setStats] = useState<Stats>({ weekSessions: 0, totalSessions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      void monthStart; // fetched only for potential future use
      const weekStart = format(new Date(Date.now() - 7 * 86400000), 'yyyy-MM-dd');

      const [weekRes, totalRes] = await Promise.all([
        supabase
          .from('workouts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('start_time', weekStart)
          .not('end_time', 'is', null),
        supabase
          .from('workouts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('end_time', 'is', null),
      ]);

      setStats({ weekSessions: weekRes.count ?? 0, totalSessions: totalRes.count ?? 0 });
      setLoading(false);
    }
    load();
  }, [userId]);

  const items = [
    {
      label: 'Sessioni 7gg',
      value: loading ? '-' : String(stats.weekSessions),
      Icon: IconCalendar,
    },
    {
      label: 'Totale sessioni',
      value: loading ? '-' : String(stats.totalSessions),
      Icon: IconActivity,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {items.map(({ label, value, Icon }) => (
        <div
          key={label}
          className="flex flex-col items-center justify-center text-center p-5"
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
            minHeight: 100,
          }}
        >
          <span style={{ color: 'var(--accent-primary)' }}>
            <Icon />
          </span>
          <div
            className="font-stat font-extrabold leading-tight mt-2"
            style={{ color: 'var(--text-primary)', fontSize: 26 }}
          >
            {loading ? (
              <span
                className="inline-block w-10 h-6 rounded animate-pulse"
                style={{ background: 'var(--bg-tertiary)' }}
              />
            ) : value}
          </div>
          <div
            className="text-[10px] font-semibold uppercase tracking-wider mt-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
