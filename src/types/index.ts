export type MuscleGroup = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core';
export type SetType = 'Normal' | 'Warmup' | 'Drop' | 'Failure';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface User {
  tg_id: number;
  first_name: string;
  username?: string;
  created_at: string;
}

export interface Exercise {
  id: string;
  user_id?: number;
  name: string;
  muscle_group: MuscleGroup;
  is_custom: boolean;
}

export interface Routine {
  id: string;
  user_id: number;
  title: string;
  day_of_week?: DayOfWeek;
  created_at: string;
  routine_exercises?: RoutineExercise[];
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  sort_order: number;
  default_sets: number;
  default_reps: number;
  default_weight: number;
  exercise?: Exercise;
}

export interface Workout {
  id: string;
  user_id: number;
  routine_id?: string;
  start_time: string;
  end_time?: string;
  notes?: string;
  workout_sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  set_type: SetType;
  completed: boolean;
  exercise?: Exercise;
}

// Store types for active workout
export interface ActiveSet {
  id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  set_type: SetType;
  completed: boolean;
}

export interface ActiveExercise {
  exercise: Exercise;
  sets: ActiveSet[];
}

// Analytics
export interface VolumeDataPoint {
  date: string;
  volume: number;
}

export interface OneRMDataPoint {
  date: string;
  volume: number;
}

export interface ExerciseHistory {
  exercise_id: string;
  exercise_name: string;
  best_1rm: number;
  best_volume: number;
  last_performed?: string;
  volume_trend: VolumeDataPoint[];
  one_rm_trend: OneRMDataPoint[];
}
