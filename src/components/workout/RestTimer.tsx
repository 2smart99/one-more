'use client';

import { useRestTimer } from '@/hooks/useTimer';
import { useWorkoutStore } from '@/store/workoutStore';

export function RestTimer() {
  const { active, display, seconds, stop } = useRestTimer();
  const { restTimerDefault, setRestTimerDefault } = useWorkoutStore();

  if (!active) return null;

  const maxSeconds = restTimerDefault;
  const progress = seconds / maxSeconds;
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 flex justify-center pointer-events-none">
      <div className="bg-white border border-border rounded-card shadow-card-lg px-6 py-4 flex items-center gap-5 pointer-events-auto w-full max-w-sm">
        {/* Circular progress */}
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#E5E7EB" strokeWidth="4" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke="#3B82F6" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-text-primary">
            {display}
          </span>
        </div>

        <div className="flex-1">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Recupero</p>
          <div className="flex gap-1.5">
            {[60, 90, 120, 180].map((s) => (
              <button
                key={s}
                onClick={() => setRestTimerDefault(s)}
                className={`text-[10px] rounded-lg px-2 py-1 font-bold transition-all ${
                  restTimerDefault === s
                    ? 'bg-accent text-white'
                    : 'bg-background text-text-secondary border border-border'
                }`}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={stop}
          className="w-8 h-8 rounded-lg bg-background text-text-muted border border-border flex items-center justify-center hover:bg-gray-100 transition-all text-sm font-bold"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
