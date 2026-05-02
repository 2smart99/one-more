-- ─── Migration: Fix RLS + Add exercise fields + Progress table ───────────────
-- Run this in your Supabase SQL editor (idempotent — safe to re-run)

-- 1. Add new columns to exercises
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS photo_url   TEXT;

-- 2. Exercise progress table (weight tracking over time)
CREATE TABLE IF NOT EXISTS exercise_progress (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     BIGINT REFERENCES users(tg_id) NOT NULL,
  exercise_id UUID REFERENCES exercises(id)  NOT NULL,
  weight      NUMERIC NOT NULL DEFAULT 0,
  reps        INTEGER,
  sets        INTEGER,
  logged_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_progress_user_ex  ON exercise_progress(user_id, exercise_id);
CREATE INDEX IF NOT EXISTS idx_progress_logged   ON exercise_progress(logged_at);

-- 3. Fix RLS policies — drop ALL (old + new) before recreating

-- users
DROP POLICY IF EXISTS "Users manage own data" ON users;
DROP POLICY IF EXISTS "users_select"          ON users;
DROP POLICY IF EXISTS "users_insert"          ON users;
DROP POLICY IF EXISTS "users_update"          ON users;
DROP POLICY IF EXISTS "users_delete"          ON users;
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON users FOR UPDATE USING (true);
CREATE POLICY "users_delete" ON users FOR DELETE USING (true);

-- exercises
DROP POLICY IF EXISTS "Public exercises read"    ON exercises;
DROP POLICY IF EXISTS "exercises_select"         ON exercises;
DROP POLICY IF EXISTS "exercises_insert"         ON exercises;
DROP POLICY IF EXISTS "exercises_update"         ON exercises;
DROP POLICY IF EXISTS "exercises_delete"         ON exercises;
DROP POLICY IF EXISTS "exercises_custom_write"   ON exercises;
CREATE POLICY "exercises_select" ON exercises FOR SELECT USING (true);
CREATE POLICY "exercises_insert" ON exercises FOR INSERT WITH CHECK (true);
CREATE POLICY "exercises_update" ON exercises FOR UPDATE USING (true);
CREATE POLICY "exercises_delete" ON exercises FOR DELETE USING (true);

-- routines
DROP POLICY IF EXISTS "Routines own data"  ON routines;
DROP POLICY IF EXISTS "routines_select"    ON routines;
DROP POLICY IF EXISTS "routines_insert"    ON routines;
DROP POLICY IF EXISTS "routines_update"    ON routines;
DROP POLICY IF EXISTS "routines_delete"    ON routines;
CREATE POLICY "routines_select" ON routines FOR SELECT USING (true);
CREATE POLICY "routines_insert" ON routines FOR INSERT WITH CHECK (true);
CREATE POLICY "routines_update" ON routines FOR UPDATE USING (true);
CREATE POLICY "routines_delete" ON routines FOR DELETE USING (true);

-- routine_exercises
DROP POLICY IF EXISTS "RoutineEx own data"   ON routine_exercises;
DROP POLICY IF EXISTS "routine_ex_select"    ON routine_exercises;
DROP POLICY IF EXISTS "routine_ex_insert"    ON routine_exercises;
DROP POLICY IF EXISTS "routine_ex_update"    ON routine_exercises;
DROP POLICY IF EXISTS "routine_ex_delete"    ON routine_exercises;
CREATE POLICY "routine_ex_select" ON routine_exercises FOR SELECT USING (true);
CREATE POLICY "routine_ex_insert" ON routine_exercises FOR INSERT WITH CHECK (true);
CREATE POLICY "routine_ex_update" ON routine_exercises FOR UPDATE USING (true);
CREATE POLICY "routine_ex_delete" ON routine_exercises FOR DELETE USING (true);

-- workouts
DROP POLICY IF EXISTS "Workouts own data" ON workouts;
DROP POLICY IF EXISTS "workouts_select"   ON workouts;
DROP POLICY IF EXISTS "workouts_insert"   ON workouts;
DROP POLICY IF EXISTS "workouts_update"   ON workouts;
DROP POLICY IF EXISTS "workouts_delete"   ON workouts;
CREATE POLICY "workouts_select" ON workouts FOR SELECT USING (true);
CREATE POLICY "workouts_insert" ON workouts FOR INSERT WITH CHECK (true);
CREATE POLICY "workouts_update" ON workouts FOR UPDATE USING (true);
CREATE POLICY "workouts_delete" ON workouts FOR DELETE USING (true);

-- workout_sets
DROP POLICY IF EXISTS "Sets own data"  ON workout_sets;
DROP POLICY IF EXISTS "sets_select"    ON workout_sets;
DROP POLICY IF EXISTS "sets_insert"    ON workout_sets;
DROP POLICY IF EXISTS "sets_update"    ON workout_sets;
DROP POLICY IF EXISTS "sets_delete"    ON workout_sets;
CREATE POLICY "sets_select" ON workout_sets FOR SELECT USING (true);
CREATE POLICY "sets_insert" ON workout_sets FOR INSERT WITH CHECK (true);
CREATE POLICY "sets_update" ON workout_sets FOR UPDATE USING (true);
CREATE POLICY "sets_delete" ON workout_sets FOR DELETE USING (true);

-- exercise_progress (new table)
ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "progress_select" ON exercise_progress;
DROP POLICY IF EXISTS "progress_insert" ON exercise_progress;
DROP POLICY IF EXISTS "progress_update" ON exercise_progress;
DROP POLICY IF EXISTS "progress_delete" ON exercise_progress;
CREATE POLICY "progress_select" ON exercise_progress FOR SELECT USING (true);
CREATE POLICY "progress_insert" ON exercise_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "progress_update" ON exercise_progress FOR UPDATE USING (true);
CREATE POLICY "progress_delete" ON exercise_progress FOR DELETE USING (true);

-- 4. Grant INSERT/UPDATE/DELETE to anon role (needed for client-side writes)
GRANT SELECT, INSERT, UPDATE, DELETE ON users             TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON exercises         TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON routines          TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON routine_exercises TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON workouts          TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON workout_sets      TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON exercise_progress TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON users             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON exercises         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON routines          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON routine_exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workouts          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON workout_sets      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON exercise_progress TO authenticated;
