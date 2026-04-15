-- MOAR Cloud Sync Schema
-- Run this in Supabase SQL Editor (Project → SQL Editor → New Query)
--
-- Creates tables mirroring the local Dexie schema, with Row Level Security so
-- each user only sees their own data.

-- ============================================================================
-- TABLES
-- ============================================================================

-- Workouts: top-level container for a workout session
create table if not exists workouts (
  id            uuid primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  template_id   uuid,
  started_at    timestamptz not null,
  completed_at  timestamptz,
  notes         text,
  updated_at    timestamptz not null default now(),
  deleted       boolean not null default false
);

create index if not exists workouts_user_idx on workouts(user_id);
create index if not exists workouts_updated_idx on workouts(user_id, updated_at);

-- Exercises: one row per exercise instance within a workout
create table if not exists workout_exercises (
  id              uuid primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  workout_id      uuid not null references workouts(id) on delete cascade,
  exercise_name   text not null,
  "order"         integer not null,
  updated_at      timestamptz not null default now(),
  deleted         boolean not null default false
);

create index if not exists workout_exercises_user_idx on workout_exercises(user_id);
create index if not exists workout_exercises_workout_idx on workout_exercises(workout_id);
create index if not exists workout_exercises_updated_idx on workout_exercises(user_id, updated_at);

-- Sets: individual set within an exercise
create table if not exists workout_sets (
  id                    uuid primary key,
  user_id               uuid not null references auth.users(id) on delete cascade,
  workout_exercise_id   uuid not null references workout_exercises(id) on delete cascade,
  set_number            integer not null,
  weight                numeric not null,
  reps                  integer not null,
  timestamp             timestamptz not null,
  updated_at            timestamptz not null default now(),
  deleted               boolean not null default false
);

create index if not exists workout_sets_user_idx on workout_sets(user_id);
create index if not exists workout_sets_exercise_idx on workout_sets(workout_exercise_id);
create index if not exists workout_sets_updated_idx on workout_sets(user_id, updated_at);

-- Templates: reusable workout recipes
create table if not exists workout_templates (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  last_used   timestamptz not null,
  exercises   jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now(),
  deleted     boolean not null default false
);

create index if not exists workout_templates_user_idx on workout_templates(user_id);
create index if not exists workout_templates_updated_idx on workout_templates(user_id, updated_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Users can only read/write their own rows. auth.uid() returns the current user.

alter table workouts enable row level security;
alter table workout_exercises enable row level security;
alter table workout_sets enable row level security;
alter table workout_templates enable row level security;

-- Workouts
drop policy if exists "workouts_select_own" on workouts;
create policy "workouts_select_own" on workouts
  for select using (auth.uid() = user_id);

drop policy if exists "workouts_insert_own" on workouts;
create policy "workouts_insert_own" on workouts
  for insert with check (auth.uid() = user_id);

drop policy if exists "workouts_update_own" on workouts;
create policy "workouts_update_own" on workouts
  for update using (auth.uid() = user_id);

drop policy if exists "workouts_delete_own" on workouts;
create policy "workouts_delete_own" on workouts
  for delete using (auth.uid() = user_id);

-- Workout Exercises
drop policy if exists "workout_exercises_select_own" on workout_exercises;
create policy "workout_exercises_select_own" on workout_exercises
  for select using (auth.uid() = user_id);

drop policy if exists "workout_exercises_insert_own" on workout_exercises;
create policy "workout_exercises_insert_own" on workout_exercises
  for insert with check (auth.uid() = user_id);

drop policy if exists "workout_exercises_update_own" on workout_exercises;
create policy "workout_exercises_update_own" on workout_exercises
  for update using (auth.uid() = user_id);

drop policy if exists "workout_exercises_delete_own" on workout_exercises;
create policy "workout_exercises_delete_own" on workout_exercises
  for delete using (auth.uid() = user_id);

-- Workout Sets
drop policy if exists "workout_sets_select_own" on workout_sets;
create policy "workout_sets_select_own" on workout_sets
  for select using (auth.uid() = user_id);

drop policy if exists "workout_sets_insert_own" on workout_sets;
create policy "workout_sets_insert_own" on workout_sets
  for insert with check (auth.uid() = user_id);

drop policy if exists "workout_sets_update_own" on workout_sets;
create policy "workout_sets_update_own" on workout_sets
  for update using (auth.uid() = user_id);

drop policy if exists "workout_sets_delete_own" on workout_sets;
create policy "workout_sets_delete_own" on workout_sets
  for delete using (auth.uid() = user_id);

-- Workout Templates
drop policy if exists "workout_templates_select_own" on workout_templates;
create policy "workout_templates_select_own" on workout_templates
  for select using (auth.uid() = user_id);

drop policy if exists "workout_templates_insert_own" on workout_templates;
create policy "workout_templates_insert_own" on workout_templates
  for insert with check (auth.uid() = user_id);

drop policy if exists "workout_templates_update_own" on workout_templates;
create policy "workout_templates_update_own" on workout_templates
  for update using (auth.uid() = user_id);

drop policy if exists "workout_templates_delete_own" on workout_templates;
create policy "workout_templates_delete_own" on workout_templates
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS: auto-update `updated_at` on row changes
-- ============================================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists workouts_updated_at on workouts;
create trigger workouts_updated_at before update on workouts
  for each row execute function set_updated_at();

drop trigger if exists workout_exercises_updated_at on workout_exercises;
create trigger workout_exercises_updated_at before update on workout_exercises
  for each row execute function set_updated_at();

drop trigger if exists workout_sets_updated_at on workout_sets;
create trigger workout_sets_updated_at before update on workout_sets
  for each row execute function set_updated_at();

drop trigger if exists workout_templates_updated_at on workout_templates;
create trigger workout_templates_updated_at before update on workout_templates
  for each row execute function set_updated_at();
