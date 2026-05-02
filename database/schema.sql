-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (synced with Telegram ID)
CREATE TABLE IF NOT EXISTS users (
  tg_id     BIGINT PRIMARY KEY,
  first_name TEXT,
  username  TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises (default catalog + user custom)
CREATE TABLE IF NOT EXISTS exercises (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     BIGINT REFERENCES users(tg_id) NULL, -- NULL = default exercise
  name        TEXT NOT NULL,
  muscle_group TEXT NOT NULL,  -- Chest, Back, Legs, Shoulders, Arms, Core
  is_custom   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routines (named workout templates)
CREATE TABLE IF NOT EXISTS routines (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     BIGINT REFERENCES users(tg_id) NOT NULL,
  title       TEXT NOT NULL,
  day_of_week INTEGER NULL, -- 0=Mon … 6=Sun, NULL = no fixed day
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises within a routine (ordered)
CREATE TABLE IF NOT EXISTS routine_exercises (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id  UUID REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  default_sets INTEGER DEFAULT 3,
  default_reps INTEGER DEFAULT 10,
  default_weight NUMERIC DEFAULT 0
);

-- Workout sessions
CREATE TABLE IF NOT EXISTS workouts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     BIGINT REFERENCES users(tg_id) NOT NULL,
  routine_id  UUID REFERENCES routines(id) NULL,
  start_time  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time    TIMESTAMP WITH TIME ZONE NULL,
  notes       TEXT
);

-- Individual sets (most granular data)
CREATE TABLE IF NOT EXISTS workout_sets (
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
CREATE INDEX IF NOT EXISTS idx_workouts_user_id     ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout  ON workout_sets(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_routines_user_id     ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_day         ON routines(day_of_week);

-- ─── Default Exercise Catalog ───────────────────────────────────────────────
INSERT INTO exercises (name, muscle_group) VALUES
  -- Petto
  ('Panca Piana', 'Chest'),
  ('Panca Inclinata', 'Chest'),
  ('Croci con Manubri', 'Chest'),
  ('Crossover ai Cavi', 'Chest'),
  ('Piegamenti (Push-Up)', 'Chest'),
  ('Dip', 'Chest'),
  -- Dorso
  ('Stacco da Terra', 'Back'),
  ('Trazioni (Pull-Up)', 'Back'),
  ('Rematore con Bilanciere', 'Back'),
  ('Lat Machine', 'Back'),
  ('Rematore Seduto', 'Back'),
  ('T-Bar Row', 'Back'),
  ('Face Pull', 'Back'),
  -- Gambe
  ('Squat', 'Legs'),
  ('Leg Press', 'Legs'),
  ('Stacco Rumeno', 'Legs'),
  ('Leg Extension', 'Legs'),
  ('Leg Curl', 'Legs'),
  ('Calf Raise', 'Legs'),
  ('Bulgarian Split Squat', 'Legs'),
  -- Spalle
  ('Military Press', 'Shoulders'),
  ('Alzate Laterali', 'Shoulders'),
  ('Alzate Frontali', 'Shoulders'),
  ('Rear Delt Fly', 'Shoulders'),
  ('Arnold Press', 'Shoulders'),
  -- Braccia
  ('Curl con Bilanciere', 'Arms'),
  ('Hammer Curl', 'Arms'),
  ('Preacher Curl', 'Arms'),
  ('Pushdown Tricipiti', 'Arms'),
  ('Skull Crusher', 'Arms'),
  ('Estensione Tricipiti Sopra', 'Arms'),
  ('Panca Stretta', 'Arms'),
  -- Core
  ('Plank', 'Core'),
  ('Crunch', 'Core'),
  ('Leg Raise', 'Core'),
  ('Russian Twist', 'Core'),
  ('Ab Wheel Rollout', 'Core')
ON CONFLICT DO NOTHING;

-- ─── Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises         ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines          ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;

-- Drop policies before recreating (safe re-run)
DROP POLICY IF EXISTS "Public exercises read"  ON exercises;
DROP POLICY IF EXISTS "Users manage own data"  ON users;
DROP POLICY IF EXISTS "Routines own data"      ON routines;
DROP POLICY IF EXISTS "Workouts own data"      ON workouts;
DROP POLICY IF EXISTS "Sets own data"          ON workout_sets;
DROP POLICY IF EXISTS "RoutineEx own data"     ON routine_exercises;

-- Public read on default exercises, plus owner access to custom ones
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

CREATE POLICY "RoutineEx own data" ON routine_exercises
  FOR ALL USING (
    routine_id IN (
      SELECT id FROM routines WHERE user_id::text = current_setting('app.user_id', TRUE)
    )
  );
