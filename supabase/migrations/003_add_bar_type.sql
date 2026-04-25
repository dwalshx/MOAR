-- Add bar_type field to workout_exercises so per-exercise equipment type
-- (Olympic bar, trap bar, dumbbell, bodyweight, cable, machine) syncs to cloud.

alter table workout_exercises add column if not exists bar_type text;
