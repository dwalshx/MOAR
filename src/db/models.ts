/**
 * All entity IDs are UUIDs (strings) so they're globally unique across
 * devices and safe to sync with Supabase without conflicts.
 *
 * Sync metadata:
 *   - updatedAt: last modification time (drives last-write-wins sync)
 *   - deleted:   tombstone flag — soft-deleted rows stay locally until
 *                confirmed pushed to cloud, then can be purged
 */

export interface Workout {
  id: string;
  name: string;
  templateId?: string;
  startedAt: Date;
  completedAt?: Date;
  notes?: string;
  updatedAt: Date;
  deleted: boolean;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseName: string;
  order: number;
  updatedAt: Date;
  deleted: boolean;
}

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  weight: number;      // lbs only per D-07
  reps: number;
  timestamp: Date;
  updatedAt: Date;
  deleted: boolean;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  lastUsed: Date;
  exercises: string[];  // exercise names in order
  updatedAt: Date;
  deleted: boolean;
}

/**
 * Generate a UUID. Uses crypto.randomUUID() when available (all modern browsers,
 * Node 19+), falls back to a simple implementation for older environments (tests).
 */
export function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: RFC 4122-ish v4 using Math.random (OK for tests only)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
