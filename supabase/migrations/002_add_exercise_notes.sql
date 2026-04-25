-- Add notes field to workout_exercises so per-exercise notes sync to cloud.
-- Workout-level notes already exist on the workouts table.

alter table workout_exercises add column if not exists notes text;
