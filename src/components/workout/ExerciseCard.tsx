'use client';

import { useEffect, useState } from 'react';
import { ActiveExercise, SetType, WorkoutSet } from '@/types';
import { useWorkoutStore } from '@/store/workoutStore';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SetRow } from './SetRow';
import { brzycki1RM, totalVolume } from '@/lib/telegram';

interface ExerciseCardProps {
  activeExercise: ActiveExercise;
  userId: number;
}

const MUSCLE_COLORS: Record<string, 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray'> = {
  Chest: 'blue', Back: 'green', Legs: 'orange', Shoulders: 'purple', Arms: 'red', Core: 'gray',
};

export function ExerciseCard({ activeExercise, userId }: ExerciseCardProps) {
  const { exercise, sets } = activeExercise;
  const { addSet, removeSet, updateSet, completeSet, removeExercise } = useWorkoutStore();
  const [prevSets, setPrevSets] = useState<WorkoutSet[]>([]);

  useEffect(() => {
    async function loadHistory() {
      const { data } = await supabase
        .from('workout_sets')
        .select('*, workout:workouts!inner(user_id, end_time)')
        .eq('exercise_id', exercise.id)
        .eq('workout.user_id', userId)
        .not('workout.end_time', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);
      setPrevSets(data ?? []);
    }
    loadHistory();
  }, [exercise.id, userId]);

  const completedSets = sets.filter((s) => s.completed);
  const volume = totalVolume(sets);
  const best1RM = Math.max(
    0,
    ...completedSets.filter((s) => s.reps > 0 && s.weight > 0).map((s) => brzycki1RM(s.weight, s.reps))
  );

  return (
    <Card>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-extrabold text-t1">{exercise.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge label={exercise.muscle_group} color={MUSCLE_COLORS[exercise.muscle_group] ?? 'gray'} />
            {completedSets.length > 0 && (
              <>
                <span className="text-xs text-t2">Vol: <b className="text-t1">{volume}kg</b></span>
                {best1RM > 0 && (
                  <span className="text-xs text-t2">1RM: <b className="text-t1">{best1RM}kg</b></span>
                )}
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => removeExercise(exercise.id)}
          className="text-t2 hover:text-danger transition-colors p-1"
        >
          x
        </button>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-2 px-1 mb-1">
        <div className="w-8" />
        <div className="flex-1 text-center text-[10px] font-semibold text-t2 uppercase tracking-wider">Peso</div>
        <div className="flex-1 text-center text-[10px] font-semibold text-t2 uppercase tracking-wider">Reps</div>
        <div className="w-10" />
        <div className="w-8" />
      </div>

      {/* Sets */}
      <div className="space-y-1">
        {sets.map((set, i) => (
          <SetRow
            key={set.id}
            set={set}
            exerciseId={exercise.id}
            prevSet={prevSets[i] ? { weight: prevSets[i].weight, reps: prevSets[i].reps } : null}
            onUpdateWeight={(v) => updateSet(exercise.id, set.id, 'weight', v)}
            onUpdateReps={(v) => updateSet(exercise.id, set.id, 'reps', v)}
            onUpdateType={(v: SetType) => updateSet(exercise.id, set.id, 'set_type', v)}
            onComplete={() => completeSet(exercise.id, set.id)}
            onRemove={() => removeSet(exercise.id, set.id)}
          />
        ))}
      </div>

      {/* Add set */}
      <Button
        variant="ghost"
        size="sm"
        fullWidth
        className="mt-3 text-accent"
        onClick={() => addSet(exercise.id)}
      >
        + Aggiungi Serie
      </Button>
    </Card>
  );
}
