import { db } from '../db/database';
import type { Workout } from '../db/models';

export function normalizeExerciseName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export const workoutService = {
  async startWorkout(): Promise<number> {
    const name = `Workout - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    return db.workouts.add({ name, startedAt: new Date() } as Workout);
  },

  async addExercise(workoutId: number, exerciseName: string): Promise<number> {
    const normalized = normalizeExerciseName(exerciseName);
    const count = await db.workoutExercises.where('workoutId').equals(workoutId).count();
    return db.workoutExercises.add({
      workoutId,
      exerciseName: normalized,
      order: count + 1,
    });
  },

  async logSet(workoutExerciseId: number, weight: number, reps: number): Promise<number> {
    const count = await db.workoutSets.where('workoutExerciseId').equals(workoutExerciseId).count();
    return db.workoutSets.add({
      workoutExerciseId,
      setNumber: count + 1,
      weight,
      reps,
      timestamp: new Date(),
    });
  },

  async updateSet(setId: number, weight: number, reps: number): Promise<void> {
    await db.workoutSets.update(setId, { weight, reps });
  },

  async deleteSet(setId: number): Promise<void> {
    await db.workoutSets.delete(setId);
  },

  async getActiveWorkout(): Promise<Workout | undefined> {
    // Pitfall #1: Dexie cannot index undefined/null — use .filter() not .where()
    return db.workouts.filter(w => !w.completedAt).first();
  },

  async finishWorkout(workoutId: number): Promise<void> {
    await db.workouts.update(workoutId, { completedAt: new Date() });
  },

  async getLastSetValues(exerciseName: string): Promise<{ weight: number; reps: number } | null> {
    const exercises = await db.workoutExercises
      .where('exerciseName').equals(exerciseName).toArray();
    if (exercises.length === 0) return null;

    const exerciseIds = exercises.map(e => e.id!);
    const sets = await db.workoutSets
      .where('workoutExerciseId').anyOf(exerciseIds)
      .reverse().sortBy('timestamp');

    return sets.length > 0
      ? { weight: sets[0].weight, reps: sets[0].reps }
      : null;
  },

  async getExerciseNames(): Promise<string[]> {
    const keys = await db.workoutExercises.orderBy('exerciseName').uniqueKeys();
    return keys as string[];
  },
};
