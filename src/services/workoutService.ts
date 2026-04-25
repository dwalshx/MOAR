import { db } from '../db/database';
import type { Workout } from '../db/models';
import { uuid } from '../db/models';
import { setVolume } from '../utils/formatters';
import { settingsService } from './settingsService';

export interface RecentWorkout {
  id: string;
  name: string;
  startedAt: Date;
  completedAt: Date;
  totalVolume: number;
}

export interface WorkoutDetail {
  id: string;
  name: string;
  startedAt: Date;
  completedAt: Date;
  totalVolume: number;
  duration: number | null; // minutes
  notes?: string;
  exercises: WorkoutExerciseDetail[];
}

export interface WorkoutExerciseDetail {
  exerciseName: string;
  sets: { setNumber: number; weight: number; reps: number }[];
  volume: number;
  notes?: string;
}

export interface ExerciseSession {
  workoutId: string;
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

/**
 * Filter live queries to exclude soft-deleted rows.
 */
const notDeleted = <T extends { deleted: boolean }>(row: T) => !row.deleted;

export const workoutService = {
  async startWorkout(): Promise<string> {
    const id = uuid();
    const name = `Workout - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    await db.workouts.add({
      id,
      name,
      startedAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
    });
    return id;
  },

  async addExercise(workoutId: string, exerciseName: string): Promise<string> {
    const id = uuid();
    const normalized = normalizeExerciseName(exerciseName);
    const count = await db.workoutExercises
      .where('workoutId').equals(workoutId)
      .filter(notDeleted).count();
    await db.workoutExercises.add({
      id,
      workoutId,
      exerciseName: normalized,
      order: count + 1,
      updatedAt: new Date(),
      deleted: false,
    });
    return id;
  },

  async logSet(workoutExerciseId: string, weight: number, reps: number): Promise<string> {
    const id = uuid();
    const count = await db.workoutSets
      .where('workoutExerciseId').equals(workoutExerciseId)
      .filter(notDeleted).count();
    await db.workoutSets.add({
      id,
      workoutExerciseId,
      setNumber: count + 1,
      weight,
      reps,
      timestamp: new Date(),
      updatedAt: new Date(),
      deleted: false,
    });
    return id;
  },

  async updateSet(setId: string, weight: number, reps: number): Promise<void> {
    await db.workoutSets.update(setId, { weight, reps, updatedAt: new Date() });
  },

  async deleteSet(setId: string): Promise<void> {
    await db.workoutSets.update(setId, { deleted: true, updatedAt: new Date() });
  },

  async deleteExercise(workoutExerciseId: string): Promise<void> {
    // Soft-delete all sets, then the exercise itself
    const sets = await db.workoutSets.where('workoutExerciseId').equals(workoutExerciseId).toArray();
    const now = new Date();
    for (const s of sets) {
      await db.workoutSets.update(s.id, { deleted: true, updatedAt: now });
    }
    await db.workoutExercises.update(workoutExerciseId, { deleted: true, updatedAt: now });
  },

  async deleteWorkout(workoutId: string): Promise<void> {
    // Soft-delete all sets, exercises, then the workout
    const now = new Date();
    const exercises = await db.workoutExercises.where('workoutId').equals(workoutId).toArray();
    for (const ex of exercises) {
      const sets = await db.workoutSets.where('workoutExerciseId').equals(ex.id).toArray();
      for (const s of sets) {
        await db.workoutSets.update(s.id, { deleted: true, updatedAt: now });
      }
      await db.workoutExercises.update(ex.id, { deleted: true, updatedAt: now });
    }
    await db.workouts.update(workoutId, { deleted: true, updatedAt: now });
  },

  async getActiveWorkout(): Promise<Workout | undefined> {
    // Pitfall #1: Dexie cannot index undefined/null — use .filter() not .where()
    return db.workouts.filter(w => !w.completedAt && !w.deleted).first();
  },

  async updateWorkoutName(workoutId: string, name: string): Promise<void> {
    await db.workouts.update(workoutId, { name, updatedAt: new Date() });
  },

  async updateWorkoutNotes(workoutId: string, notes: string): Promise<void> {
    await db.workouts.update(workoutId, { notes, updatedAt: new Date() });
  },

  async updateExerciseNotes(workoutExerciseId: string, notes: string): Promise<void> {
    await db.workoutExercises.update(workoutExerciseId, { notes, updatedAt: new Date() });
  },

  async getWorkoutVolume(workoutId: string): Promise<number> {
    const exercises = await db.workoutExercises
      .where('workoutId').equals(workoutId)
      .filter(notDeleted).toArray();
    if (exercises.length === 0) return 0;

    const exerciseIds = exercises.map(e => e.id);
    const sets = await db.workoutSets
      .where('workoutExerciseId').anyOf(exerciseIds)
      .filter(notDeleted).toArray();
    return sets.reduce((sum, s) => sum + setVolume(s.weight, s.reps, settingsService.getBodyWeight()), 0);
  },

  async getRecentWorkouts(limit: number = 10): Promise<RecentWorkout[]> {
    const allWorkouts = await db.workouts.filter(notDeleted).toArray();
    const completed = allWorkouts
      .filter(w => w.completedAt)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);

    const results: RecentWorkout[] = [];
    for (const w of completed) {
      const totalVolume = await this.getWorkoutVolume(w.id);
      results.push({
        id: w.id,
        name: w.name,
        startedAt: w.startedAt,
        completedAt: w.completedAt!,
        totalVolume,
      });
    }
    return results;
  },

  async startWorkoutFromTemplate(templateName: string): Promise<string> {
    const workoutId = uuid();
    await db.workouts.add({
      id: workoutId,
      name: templateName,
      startedAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
    });

    const template = await db.workoutTemplates
      .where('name').equals(templateName)
      .filter(notDeleted).first();

    if (template) {
      for (const exerciseName of template.exercises) {
        await this.addExercise(workoutId, exerciseName);
      }
    }

    return workoutId;
  },

  async upsertTemplate(workoutId: string): Promise<void> {
    const workout = await db.workouts.get(workoutId);
    if (!workout) return;

    const exercises = await db.workoutExercises
      .where('workoutId').equals(workoutId)
      .filter(notDeleted)
      .sortBy('order');
    const exerciseNames = exercises.map(e => e.exerciseName);

    const existing = await db.workoutTemplates
      .where('name').equals(workout.name)
      .filter(notDeleted).first();

    const now = new Date();
    if (existing) {
      await db.workoutTemplates.update(existing.id, {
        exercises: exerciseNames,
        lastUsed: now,
        updatedAt: now,
      });
    } else {
      await db.workoutTemplates.add({
        id: uuid(),
        name: workout.name,
        exercises: exerciseNames,
        lastUsed: now,
        updatedAt: now,
        deleted: false,
      });
    }
  },

  async finishWorkout(workoutId: string): Promise<void> {
    const now = new Date();
    await db.workouts.update(workoutId, { completedAt: now, updatedAt: now });
    await this.upsertTemplate(workoutId);
  },

  async getLastSetValues(exerciseName: string): Promise<{ weight: number; reps: number } | null> {
    const exercises = await db.workoutExercises
      .where('exerciseName').equals(exerciseName)
      .filter(notDeleted).toArray();
    if (exercises.length === 0) return null;

    const exerciseIds = exercises.map(e => e.id);
    const sets = await db.workoutSets
      .where('workoutExerciseId').anyOf(exerciseIds)
      .filter(notDeleted).toArray();

    if (sets.length === 0) return null;

    // Sort by timestamp desc with setNumber as tiebreaker (same-ms timestamps)
    sets.sort((a, b) => {
      const tDiff = b.timestamp.getTime() - a.timestamp.getTime();
      if (tDiff !== 0) return tDiff;
      return b.setNumber - a.setNumber;
    });

    return { weight: sets[0].weight, reps: sets[0].reps };
  },

  async getExerciseNames(): Promise<string[]> {
    // uniqueKeys doesn't filter by deleted, but duplicates from soft-deletes
    // aren't a real issue — we want the name in autocomplete either way.
    const keys = await db.workoutExercises.orderBy('exerciseName').uniqueKeys();
    return keys as string[];
  },

  async getCompletedWorkouts(offset: number = 0, limit: number = 20): Promise<RecentWorkout[]> {
    const allWorkouts = await db.workouts.filter(notDeleted).toArray();
    const completed = allWorkouts
      .filter(w => w.completedAt)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())
      .slice(offset, offset + limit);

    const results: RecentWorkout[] = [];
    for (const w of completed) {
      const totalVolume = await this.getWorkoutVolume(w.id);
      results.push({
        id: w.id,
        name: w.name,
        startedAt: w.startedAt,
        completedAt: w.completedAt!,
        totalVolume,
      });
    }
    return results;
  },

  async getWorkoutDetail(workoutId: string): Promise<WorkoutDetail | null> {
    const workout = await db.workouts.get(workoutId);
    if (!workout || !workout.completedAt || workout.deleted) return null;

    const exercises = await db.workoutExercises
      .where('workoutId').equals(workoutId)
      .filter(notDeleted)
      .sortBy('order');

    let totalVolume = 0;
    let earliestTimestamp: Date | null = null;
    let latestTimestamp: Date | null = null;
    const exerciseDetails: WorkoutExerciseDetail[] = [];

    for (const ex of exercises) {
      const sets = await db.workoutSets
        .where('workoutExerciseId').equals(ex.id)
        .filter(notDeleted)
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
        notes: ex.notes,
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
      id: workout.id,
      name: workout.name,
      startedAt: workout.startedAt,
      completedAt: workout.completedAt,
      totalVolume,
      duration,
      notes: workout.notes,
      exercises: exerciseDetails,
    };
  },

  async getExerciseHistory(exerciseName: string, limit: number = 20): Promise<ExerciseSession[]> {
    const allExercises = await db.workoutExercises
      .where('exerciseName').equals(exerciseName)
      .filter(notDeleted).toArray();

    const sessions: ExerciseSession[] = [];

    for (const ex of allExercises) {
      const workout = await db.workouts.get(ex.workoutId);
      if (!workout || !workout.completedAt || workout.deleted) continue;

      const sets = await db.workoutSets
        .where('workoutExerciseId').equals(ex.id)
        .filter(notDeleted)
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
