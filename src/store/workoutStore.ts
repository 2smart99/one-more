import { create } from 'zustand';
import { ActiveExercise, ActiveSet, Exercise, SetType } from '@/types';

interface WorkoutState {
  workoutId: string | null;
  startTime: Date | null;
  exercises: ActiveExercise[];
  restTimerActive: boolean;
  restTimerSeconds: number;
  restTimerDefault: number;

  startWorkout: (workoutId: string) => void;
  endWorkout: () => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  updateSet: (exerciseId: string, setId: string, field: 'weight' | 'reps' | 'set_type', value: number | SetType) => void;
  completeSet: (exerciseId: string, setId: string) => void;
  startRestTimer: (seconds?: number) => void;
  stopRestTimer: () => void;
  tickRestTimer: () => void;
  setRestTimerDefault: (seconds: number) => void;
}

function makeSet(setNumber: number): ActiveSet {
  return {
    id: crypto.randomUUID(),
    exercise_id: '',
    set_number: setNumber,
    weight: 0,
    reps: 0,
    set_type: 'Normal',
    completed: false,
  };
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workoutId: null,
  startTime: null,
  exercises: [],
  restTimerActive: false,
  restTimerSeconds: 0,
  restTimerDefault: 90,

  startWorkout: (workoutId) =>
    set({ workoutId, startTime: new Date(), exercises: [] }),

  endWorkout: () =>
    set({ workoutId: null, startTime: null, exercises: [], restTimerActive: false }),

  addExercise: (exercise) =>
    set((state) => ({
      exercises: [
        ...state.exercises,
        { exercise, sets: [makeSet(1)] },
      ],
    })),

  removeExercise: (exerciseId) =>
    set((state) => ({
      exercises: state.exercises.filter((e) => e.exercise.id !== exerciseId),
    })),

  addSet: (exerciseId) =>
    set((state) => ({
      exercises: state.exercises.map((e) => {
        if (e.exercise.id !== exerciseId) return e;
        const nextNum = e.sets.length + 1;
        const last = e.sets[e.sets.length - 1];
        const newSet: ActiveSet = {
          ...makeSet(nextNum),
          weight: last?.weight ?? 0,
          reps: last?.reps ?? 0,
          exercise_id: exerciseId,
        };
        return { ...e, sets: [...e.sets, newSet] };
      }),
    })),

  removeSet: (exerciseId, setId) =>
    set((state) => ({
      exercises: state.exercises.map((e) => {
        if (e.exercise.id !== exerciseId) return e;
        const filtered = e.sets
          .filter((s) => s.id !== setId)
          .map((s, i) => ({ ...s, set_number: i + 1 }));
        return { ...e, sets: filtered };
      }),
    })),

  updateSet: (exerciseId, setId, field, value) =>
    set((state) => ({
      exercises: state.exercises.map((e) => {
        if (e.exercise.id !== exerciseId) return e;
        return {
          ...e,
          sets: e.sets.map((s) =>
            s.id === setId ? { ...s, [field]: value } : s
          ),
        };
      }),
    })),

  completeSet: (exerciseId, setId) => {
    set((state) => ({
      exercises: state.exercises.map((e) => {
        if (e.exercise.id !== exerciseId) return e;
        return {
          ...e,
          sets: e.sets.map((s) =>
            s.id === setId ? { ...s, completed: !s.completed } : s
          ),
        };
      }),
    }));
    const { restTimerDefault } = get();
    get().startRestTimer(restTimerDefault);
  },

  startRestTimer: (seconds) =>
    set((state) => ({
      restTimerActive: true,
      restTimerSeconds: seconds ?? state.restTimerDefault,
    })),

  stopRestTimer: () => set({ restTimerActive: false, restTimerSeconds: 0 }),

  tickRestTimer: () =>
    set((state) => {
      if (state.restTimerSeconds <= 1) return { restTimerActive: false, restTimerSeconds: 0 };
      return { restTimerSeconds: state.restTimerSeconds - 1 };
    }),

  setRestTimerDefault: (seconds) => set({ restTimerDefault: seconds }),
}));
