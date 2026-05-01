'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { totalVolume, brzycki1RM } from '@/lib/telegram';
import { useWorkoutStore } from '@/store/workoutStore';
import { Workout, WorkoutSet } from '@/types';

export function useWorkoutActions(userId: number) {
  const store = useWorkoutStore();

  const createWorkout = useCallback(async (routineId?: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('workouts')
      .insert({ user_id: userId, routine_id: routineId ?? null })
      .select('id')
      .single();
    if (error || !data) return null;
    store.startWorkout(data.id);
    return data.id;
  }, [userId, store]);

  const finishWorkout = useCallback(async (): Promise<Workout | null> => {
    if (!store.workoutId) return null;

    // Persist all completed sets
    const setsToInsert: Omit<WorkoutSet, 'id' | 'exercise'>[] = [];
    for (const ae of store.exercises) {
      for (const s of ae.sets) {
        setsToInsert.push({
          workout_id: store.workoutId,
          exercise_id: ae.exercise.id,
          set_number: s.set_number,
          weight: s.weight,
          reps: s.reps,
          set_type: s.set_type,
          completed: s.completed,
        });
      }
    }
    if (setsToInsert.length > 0) {
      await supabase.from('workout_sets').insert(setsToInsert);
    }

    // Mark end time
    const { data } = await supabase
      .from('workouts')
      .update({ end_time: new Date().toISOString() })
      .eq('id', store.workoutId)
      .select()
      .single();

    store.endWorkout();
    return data;
  }, [store]);

  const allSets = store.exercises.flatMap((e) => e.sets);
  const volume = totalVolume(allSets);
  const best1RM = Math.max(
    0,
    ...allSets
      .filter((s) => s.completed && s.reps > 0 && s.weight > 0)
      .map((s) => brzycki1RM(s.weight, s.reps))
  );

  return { createWorkout, finishWorkout, volume, best1RM };
}
