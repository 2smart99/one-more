-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (synced with Telegram ID)
CREATE TABLE users (
  tg_id     BIGINT PRIMARY KEY,
  first_name TEXT,
  username  TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises (default catalog + user custom)
CREATE TABLE exercises (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     BIGINT REFERENCES users(tg_id) NULL, -- NULL = default exercise
  name        TEXT NOT NULL,
  muscle_group TEXT NOT NULL,  -- Chest, Back, Legs, Shoulders, Arms, Core
  is_custom   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routines (named workout templates)
CREATE TABLE routines (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     BIGINT REFERENCES users(tg_id) NOT NULL,
  title       TEXT NOT NULL,
  day_of_week INTEGER NULL, -- 0=Mon … 6=Sun, NULL = no fixed day
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises within a routine (ordered)
CREATE TABLE routine_exercises (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id  UUID REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  default_sets INTEGER DEFAULT 3,
  default_reps INTEGER DEFAULT 10,
  default_weight NUMERIC DEFAULT 0
);

-- Workout sessions
CREATE TABLE workouts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     BIGINT REFERENCES users(tg_id) NOT NULL,
  routine_id  UUID REFERENCES routines(id) NULL,
  start_time  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time    TIMESTAMP WITH TIME ZONE NULL,
  notes       TEXT
);

-- Individual sets (most granular data)
CREATE TABLE workout_sets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id  UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  set_number  INTEGER NOT NULL,
  weight      NUMERIC NOT NULL DEFAULT 0,
  reps        INTEGER NOT NULL DEFAULT 0,
  set_type    TEXT NOT NULL DEFAULT 'Normal', -- Normal | Warmup | Drop | Failure
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX idx_workouts_user_id    ON workouts(user_id);
CREATE INDEX idx_workout_sets_workout ON workout_sets(workout_id);
CREATE INDEX idx_workout_sets_exercise ON workout_sets(exercise_id);
CREATE INDEX idx_routines_user_id    ON routines(user_id);
CREATE INDEX idx_routines_day        ON routines(day_of_week);

-- ─── Default Exercise Catalog ───────────────────────────────────────────────
INSERT INTO exercises (name, muscle_group) VALUES
  -- Chest
  ('Bench Press', 'Chest'),
  ('Incline Bench Press', 'Chest'),
  ('Dumbbell Fly', 'Chest'),
  ('Cable Crossover', 'Chest'),
  ('Push-Up', 'Chest'),
  ('Dip', 'Chest'),
  -- Back
  ('Deadlift', 'Back'),
  ('Pull-Up', 'Back'),
  ('Barbell Row', 'Back'),
  ('Lat Pulldown', 'Back'),
  ('Seated Cable Row', 'Back'),
  ('T-Bar Row', 'Back'),
  ('Face Pull', 'Back'),
  -- Legs
  ('Squat', 'Legs'),
  ('Leg Press', 'Legs'),
  ('Romanian Deadlift', 'Legs'),
  ('Leg Extension', 'Legs'),
  ('Leg Curl', 'Legs'),
  ('Calf Raise', 'Legs'),
  ('Bulgarian Split Squat', 'Legs'),
  -- Shoulders
  ('Overhead Press', 'Shoulders'),
  ('Lateral Raise', 'Shoulders'),
  ('Front Raise', 'Shoulders'),
  ('Rear Delt Fly', 'Shoulders'),
  ('Arnold Press', 'Shoulders'),
  -- Arms
  ('Barbell Curl', 'Arms'),
  ('Hammer Curl', 'Arms'),
  ('Preacher Curl', 'Arms'),
  ('Tricep Pushdown', 'Arms'),
  ('Skull Crusher', 'Arms'),
  ('Overhead Tricep Extension', 'Arms'),
  ('Close-Grip Bench Press', 'Arms'),
  -- Core
  ('Plank', 'Core'),
  ('Crunch', 'Core'),
  ('Leg Raise', 'Core'),
  ('Russian Twist', 'Core'),
  ('Ab Wheel Rollout', 'Core');

-- ─── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines       ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;

-- Public read on default exercises
CREATE POLICY "Public exercises read" ON exercises
  FOR SELECT USING (user_id IS NULL OR user_id::text = current_setting('app.user_id', TRUE));

CREATE POLICY "Users manage own data" ON users
  FOR ALL USING (tg_id::text = current_setting('app.user_id', TRUE));

CREATE POLICY "Routines own data" ON routines
  FOR ALL USING (user_id::text = current_setting('app.user_id', TRUE));

CREATE POLICY "Workouts own data" ON workouts
  FOR ALL USING (user_id::text = current_setting('app.user_id', TRUE));

CREATE POLICY "Sets own data" ON workout_sets
  FOR ALL USING (
    workout_id IN (
      SELECT id FROM workouts WHERE user_id::text = current_setting('app.user_id', TRUE)
    )
  );
