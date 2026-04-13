import { db } from '../db/database';
import type { Workout } from '../db/models';
import { setVolume } from '../utils/formatters';
import { settingsService } from './settingsService';

export interface RecentWorkout {
  id: number;
  name: string;
  startedAt: Date;
  completedAt: Date;
  totalVolume: number;
}

export interface WorkoutDetail {
  id: number;
  name: string;
  startedAt: Date;
  completedAt: Date;
  totalVolume: number;
  duration: number | null; // minutes
  exercises: WorkoutExerciseDetail[];
}

export interface WorkoutExerciseDetail {
  exerciseName: string;
  sets: { setNumber: number; weight: number; reps: number }[];
  volume: number;
}

export interface ExerciseSession {
  workoutId: number;
  date: Date;
  setCount: number;
  totalVolume: number;
  sets: { setNumber: number; weight: number; reps: number }[];
}

export interface VolumeDataPoint {
  date: string;     // "Apr 9" for chart axis
  volume: number;
  fullDate: string; // "Apr 9, 2026" for tooltip
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

  async deleteExercise(workoutExerciseId: number): Promise<void> {
    // Delete all sets for this exercise, then the exercise itself
    const sets = await db.workoutSets.where('workoutExerciseId').equals(workoutExerciseId).toArray();
    await db.workoutSets.bulkDelete(sets.map(s => s.id!));
    await db.workoutExercises.delete(workoutExerciseId);
  },

  async deleteWorkout(workoutId: number): Promise<void> {
    // Delete all sets, exercises, then the workout
    const exercises = await db.workoutExercises.where('workoutId').equals(workoutId).toArray();
    for (const ex of exercises) {
      const sets = await db.workoutSets.where('workoutExerciseId').equals(ex.id!).toArray();
      await db.workoutSets.bulkDelete(sets.map(s => s.id!));
    }
    await db.workoutExercises.bulkDelete(exercises.map(e => e.id!));
    await db.workouts.delete(workoutId);
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
    return sets.reduce((sum, s) => sum + setVolume(s.weight, s.reps, settingsService.getBodyWeight()), 0);
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

  async getCompletedWorkouts(offset: number = 0, limit: number = 20): Promise<RecentWorkout[]> {
    const allWorkouts = await db.workouts.toArray();
    const completed = allWorkouts
      .filter(w => w.completedAt)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())
      .slice(offset, offset + limit);

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

  async getWorkoutDetail(workoutId: number): Promise<WorkoutDetail | null> {
    const workout = await db.workouts.get(workoutId);
    if (!workout || !workout.completedAt) return null;

    const exercises = await db.workoutExercises
      .where('workoutId').equals(workoutId)
      .sortBy('order');

    let totalVolume = 0;
    let earliestTimestamp: Date | null = null;
    let latestTimestamp: Date | null = null;
    const exerciseDetails: WorkoutExerciseDetail[] = [];

    for (const ex of exercises) {
      const sets = await db.workoutSets
        .where('workoutExerciseId').equals(ex.id!)
        .sortBy('setNumber');

      const exVolume = sets.reduce((sum, s) => sum + setVolume(s.weight, s.reps, settingsService.getBodyWeight()), 0);
      totalVolume += exVolume;

      for (const s of sets) {
        if (!earliestTimestamp || s.timestamp < earliestTimestamp) {
          earliestTimestamp = s.timestamp;
        }
        if (!latestTimestamp || s.timestamp > latestTimestamp) {
          latestTimestamp = s.timestamp;
        }
      }

      exerciseDetails.push({
        exerciseName: ex.exerciseName,
        sets: sets.map(s => ({ setNumber: s.setNumber, weight: s.weight, reps: s.reps })),
        volume: exVolume,
      });
    }

    let duration: number | null = null;
    if (earliestTimestamp && latestTimestamp) {
      if (earliestTimestamp.getTime() === latestTimestamp.getTime()) {
        duration = 0;
      } else {
        duration = Math.round((latestTimestamp.getTime() - earliestTimestamp.getTime()) / 60000);
      }
    }

    return {
      id: workout.id!,
      name: workout.name,
      startedAt: workout.startedAt,
      completedAt: workout.completedAt,
      totalVolume,
      duration,
      exercises: exerciseDetails,
    };
  },

  async getExerciseHistory(exerciseName: string, limit: number = 20): Promise<ExerciseSession[]> {
    const allExercises = await db.workoutExercises
      .where('exerciseName').equals(exerciseName).toArray();

    const sessions: ExerciseSession[] = [];

    for (const ex of allExercises) {
      const workout = await db.workouts.get(ex.workoutId);
      if (!workout || !workout.completedAt) continue;

      const sets = await db.workoutSets
        .where('workoutExerciseId').equals(ex.id!)
        .sortBy('setNumber');

      const totalVolume = sets.reduce((sum, s) => sum + setVolume(s.weight, s.reps, settingsService.getBodyWeight()), 0);

      sessions.push({
        workoutId: ex.workoutId,
        date: workout.completedAt,
        setCount: sets.length,
        totalVolume,
        sets: sets.map(s => ({ setNumber: s.setNumber, weight: s.weight, reps: s.reps })),
      });
    }

    sessions.sort((a, b) => b.date.getTime() - a.date.getTime());
    return sessions.slice(0, limit);
  },

  async getWorkoutVolumeChartData(limit: number = 20): Promise<VolumeDataPoint[]> {
    const workouts = await this.getCompletedWorkouts(0, limit);
    const data = workouts.map(w => ({
      date: w.completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: w.totalVolume,
      fullDate: w.completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }));
    // Reverse so oldest is first (left-to-right chronological for chart)
    return data.reverse();
  },
};
