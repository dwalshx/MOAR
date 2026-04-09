import { db } from '../db/database';
import type { Workout } from '../db/models';

export interface RecentWorkout {
  id: number;
  name: string;
  startedAt: Date;
  completedAt: Date;
  totalVolume: number;
}

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

  async updateWorkoutName(workoutId: number, name: string): Promise<void> {
    await db.workouts.update(workoutId, { name });
  },

  async getWorkoutVolume(workoutId: number): Promise<number> {
    const exercises = await db.workoutExercises
      .where('workoutId').equals(workoutId).toArray();
    if (exercises.length === 0) return 0;

    const exerciseIds = exercises.map(e => e.id!);
    const sets = await db.workoutSets
      .where('workoutExerciseId').anyOf(exerciseIds).toArray();
    return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
  },

  async getRecentWorkouts(limit: number = 10): Promise<RecentWorkout[]> {
    const allWorkouts = await db.workouts.toArray();
    const completed = allWorkouts
      .filter(w => w.completedAt)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);

    const results: RecentWorkout[] = [];
    for (const w of completed) {
      const totalVolume = await this.getWorkoutVolume(w.id!);
      results.push({
        id: w.id!,
        name: w.name,
        startedAt: w.startedAt,
        completedAt: w.completedAt!,
        totalVolume,
      });
    }
    return results;
  },

  async startWorkoutFromTemplate(templateName: string): Promise<number> {
    const workoutId = await db.workouts.add({
      name: templateName,
      startedAt: new Date(),
    } as Workout);

    const template = await db.workoutTemplates
      .where('name').equals(templateName).first();

    if (template) {
      for (const exerciseName of template.exercises) {
        await this.addExercise(workoutId, exerciseName);
      }
    }

    return workoutId;
  },

  async upsertTemplate(workoutId: number): Promise<void> {
    const workout = await db.workouts.get(workoutId);
    if (!workout) return;

    const exercises = await db.workoutExercises
      .where('workoutId').equals(workoutId)
      .sortBy('order');
    const exerciseNames = exercises.map(e => e.exerciseName);

    const existing = await db.workoutTemplates
      .where('name').equals(workout.name).first();

    if (existing) {
      await db.workoutTemplates.update(existing.id!, {
        exercises: exerciseNames,
        lastUsed: new Date(),
      });
    } else {
      await db.workoutTemplates.add({
        name: workout.name,
        exercises: exerciseNames,
        lastUsed: new Date(),
      });
    }
  },

  async finishWorkout(workoutId: number): Promise<void> {
    await db.workouts.update(workoutId, { completedAt: new Date() });
    await this.upsertTemplate(workoutId);
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
