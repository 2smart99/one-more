'use client';

import { useEffect } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';
import { haptic } from '@/lib/telegram';

export function useRestTimer() {
  const { restTimerActive, restTimerSeconds, tickRestTimer, stopRestTimer } = useWorkoutStore();

  useEffect(() => {
    if (!restTimerActive) return;
    const id = setInterval(() => {
      tickRestTimer();
      if (restTimerSeconds <= 1) haptic('success');
    }, 1000);
    return () => clearInterval(id);
  }, [restTimerActive, restTimerSeconds, tickRestTimer]);

  const minutes = Math.floor(restTimerSeconds / 60);
  const seconds = restTimerSeconds % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progress = restTimerSeconds; // raw seconds remaining

  return { active: restTimerActive, display, seconds: restTimerSeconds, progress, stop: stopRestTimer };
}
