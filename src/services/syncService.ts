import { db } from '../db/database';
import { supabase } from '../lib/supabase';

/**
 * Last-sync timestamp per table, stored in localStorage.
 * We only fetch rows changed since this timestamp on pull.
 */
const LAST_SYNC_KEY_PREFIX = 'moar_last_sync_';

function getLastSync(table: string): string {
  if (typeof localStorage === 'undefined') return '1970-01-01T00:00:00Z';
  return localStorage.getItem(LAST_SYNC_KEY_PREFIX + table) || '1970-01-01T00:00:00Z';
}

function setLastSync(table: string, iso: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LAST_SYNC_KEY_PREFIX + table, iso);
}

function resetLastSync(): void {
  if (typeof localStorage === 'undefined') return;
  for (const table of ['workouts', 'workout_exercises', 'workout_sets', 'workout_templates']) {
    localStorage.removeItem(LAST_SYNC_KEY_PREFIX + table);
  }
}

// --- Type mapping: local (Dexie) camelCase ↔ remote (Supabase) snake_case ---

interface RemoteWorkout {
  id: string;
  user_id: string;
  name: string;
  template_id: string | null;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  updated_at: string;
  deleted: boolean;
}

interface RemoteWorkoutExercise {
  id: string;
  user_id: string;
  workout_id: string;
  exercise_name: string;
  order: number;
  updated_at: string;
  deleted: boolean;
}

interface RemoteWorkoutSet {
  id: string;
  user_id: string;
  workout_exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  timestamp: string;
  updated_at: string;
  deleted: boolean;
}

interface RemoteWorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  last_used: string;
  exercises: string[];
  updated_at: string;
  deleted: boolean;
}

// --- Sync state ---

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncState {
  status: SyncStatus;
  lastSyncAt: Date | null;
  error: string | null;
}

const listeners = new Set<(s: SyncState) => void>();
let currentState: SyncState = { status: 'idle', lastSyncAt: null, error: null };

function setState(partial: Partial<SyncState>) {
  currentState = { ...currentState, ...partial };
  for (const l of listeners) l(currentState);
}

export function subscribeSyncState(listener: (s: SyncState) => void): () => void {
  listeners.add(listener);
  listener(currentState);
  return () => {
    listeners.delete(listener);
  };
}

export function getSyncState(): SyncState {
  return currentState;
}

// --- Sync operations ---

/**
 * Pull remote changes since last sync into local Dexie.
 * Local row is overwritten if remote row is newer (last-write-wins).
 */
async function pull(userId: string): Promise<void> {
  if (!supabase) return;

  // Workouts
  {
    const since = getLastSync('workouts');
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', since);
    if (error) throw error;
    if (data) {
      for (const r of data as RemoteWorkout[]) {
        const local = await db.workouts.get(r.id);
        const remoteUpdated = new Date(r.updated_at).getTime();
        if (!local || new Date(local.updatedAt).getTime() < remoteUpdated) {
          await db.workouts.put({
            id: r.id,
            name: r.name,
            templateId: r.template_id ?? undefined,
            startedAt: new Date(r.started_at),
            completedAt: r.completed_at ? new Date(r.completed_at) : undefined,
            notes: r.notes ?? undefined,
            updatedAt: new Date(r.updated_at),
            deleted: r.deleted,
          });
        }
      }
      // Track max updated_at seen
      const maxSeen = data.reduce(
        (max, r) => (new Date(r.updated_at) > new Date(max) ? r.updated_at : max),
        since
      );
      setLastSync('workouts', maxSeen);
    }
  }

  // Workout Exercises
  {
    const since = getLastSync('workout_exercises');
    const { data, error } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', since);
    if (error) throw error;
    if (data) {
      for (const r of data as RemoteWorkoutExercise[]) {
        const local = await db.workoutExercises.get(r.id);
        const remoteUpdated = new Date(r.updated_at).getTime();
        if (!local || new Date(local.updatedAt).getTime() < remoteUpdated) {
          await db.workoutExercises.put({
            id: r.id,
            workoutId: r.workout_id,
            exerciseName: r.exercise_name,
            order: r.order,
            updatedAt: new Date(r.updated_at),
            deleted: r.deleted,
          });
        }
      }
      const maxSeen = data.reduce(
        (max, r) => (new Date(r.updated_at) > new Date(max) ? r.updated_at : max),
        since
      );
      setLastSync('workout_exercises', maxSeen);
    }
  }

  // Workout Sets
  {
    const since = getLastSync('workout_sets');
    const { data, error } = await supabase
      .from('workout_sets')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', since);
    if (error) throw error;
    if (data) {
      for (const r of data as RemoteWorkoutSet[]) {
        const local = await db.workoutSets.get(r.id);
        const remoteUpdated = new Date(r.updated_at).getTime();
        if (!local || new Date(local.updatedAt).getTime() < remoteUpdated) {
          await db.workoutSets.put({
            id: r.id,
            workoutExerciseId: r.workout_exercise_id,
            setNumber: r.set_number,
            weight: r.weight,
            reps: r.reps,
            timestamp: new Date(r.timestamp),
            updatedAt: new Date(r.updated_at),
            deleted: r.deleted,
          });
        }
      }
      const maxSeen = data.reduce(
        (max, r) => (new Date(r.updated_at) > new Date(max) ? r.updated_at : max),
        since
      );
      setLastSync('workout_sets', maxSeen);
    }
  }

  // Workout Templates
  {
    const since = getLastSync('workout_templates');
    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', since);
    if (error) throw error;
    if (data) {
      for (const r of data as RemoteWorkoutTemplate[]) {
        const local = await db.workoutTemplates.get(r.id);
        const remoteUpdated = new Date(r.updated_at).getTime();
        if (!local || new Date(local.updatedAt).getTime() < remoteUpdated) {
          await db.workoutTemplates.put({
            id: r.id,
            name: r.name,
            lastUsed: new Date(r.last_used),
            exercises: r.exercises,
            updatedAt: new Date(r.updated_at),
            deleted: r.deleted,
          });
        }
      }
      const maxSeen = data.reduce(
        (max, r) => (new Date(r.updated_at) > new Date(max) ? r.updated_at : max),
        since
      );
      setLastSync('workout_templates', maxSeen);
    }
  }
}

/**
 * Push all local rows to Supabase using upsert.
 * We don't track which rows are "dirty" yet — just upsert everything.
 * Supabase's updated_at trigger will be bypassed since we pass our own.
 */
async function push(userId: string): Promise<void> {
  if (!supabase) return;

  // Workouts
  {
    const rows = await db.workouts.toArray();
    if (rows.length > 0) {
      const payload = rows.map((r): RemoteWorkout => ({
        id: r.id,
        user_id: userId,
        name: r.name,
        template_id: r.templateId ?? null,
        started_at: r.startedAt.toISOString(),
        completed_at: r.completedAt?.toISOString() ?? null,
        notes: r.notes ?? null,
        updated_at: r.updatedAt.toISOString(),
        deleted: r.deleted,
      }));
      const { error } = await supabase.from('workouts').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
    }
  }

  // Workout Exercises
  {
    const rows = await db.workoutExercises.toArray();
    if (rows.length > 0) {
      const payload = rows.map((r): RemoteWorkoutExercise => ({
        id: r.id,
        user_id: userId,
        workout_id: r.workoutId,
        exercise_name: r.exerciseName,
        order: r.order,
        updated_at: r.updatedAt.toISOString(),
        deleted: r.deleted,
      }));
      const { error } = await supabase.from('workout_exercises').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
    }
  }

  // Workout Sets
  {
    const rows = await db.workoutSets.toArray();
    if (rows.length > 0) {
      const payload = rows.map((r): RemoteWorkoutSet => ({
        id: r.id,
        user_id: userId,
        workout_exercise_id: r.workoutExerciseId,
        set_number: r.setNumber,
        weight: r.weight,
        reps: r.reps,
        timestamp: r.timestamp.toISOString(),
        updated_at: r.updatedAt.toISOString(),
        deleted: r.deleted,
      }));
      const { error } = await supabase.from('workout_sets').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
    }
  }

  // Workout Templates
  {
    const rows = await db.workoutTemplates.toArray();
    if (rows.length > 0) {
      const payload = rows.map((r): RemoteWorkoutTemplate => ({
        id: r.id,
        user_id: userId,
        name: r.name,
        last_used: r.lastUsed.toISOString(),
        exercises: r.exercises,
        updated_at: r.updatedAt.toISOString(),
        deleted: r.deleted,
      }));
      const { error } = await supabase.from('workout_templates').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
    }
  }
}

/**
 * Full bidirectional sync: pull remote changes, then push local.
 * Updates lastSyncAt state on success.
 */
let syncInProgress = false;
export async function sync(userId: string): Promise<void> {
  if (!supabase || syncInProgress) return;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    setState({ status: 'offline' });
    return;
  }

  syncInProgress = true;
  setState({ status: 'syncing', error: null });
  try {
    await pull(userId);
    await push(userId);
    setState({ status: 'idle', lastSyncAt: new Date(), error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setState({ status: 'error', error: message });
    // eslint-disable-next-line no-console
    console.error('[sync] error:', err);
  } finally {
    syncInProgress = false;
  }
}

/**
 * Called when the user signs out — clear last-sync timestamps so a new
 * user's data doesn't mix with the previous user's local cache.
 * Also clears local DB since it belonged to the previous user.
 */
export async function onSignOut(): Promise<void> {
  resetLastSync();
  setState({ status: 'idle', lastSyncAt: null, error: null });
  // Clear local data — it belonged to the previous user
  await db.delete();
  await db.open();
}
