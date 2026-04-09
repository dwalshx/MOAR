import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/database';
import { workoutService, normalizeExerciseName } from './workoutService';

beforeEach(async () => {
  await db.workoutSets.clear();
  await db.workoutExercises.clear();
  await db.workouts.clear();
});

describe('normalizeExerciseName', () => {
  it('title-cases a lowercase name', () => {
    expect(normalizeExerciseName('bench press')).toBe('Bench Press');
  });

  it('trims whitespace and normalizes spacing', () => {
    expect(normalizeExerciseName(' squat  ')).toBe('Squat');
  });

  it('handles mixed case', () => {
    expect(normalizeExerciseName('OVERHEAD press')).toBe('Overhead Press');
  });
});

describe('startWorkout', () => {
  it('creates a workout with auto-generated name in "Workout - Mon D" format', async () => {
    const id = await workoutService.startWorkout();
    expect(id).toBeTypeOf('number');

    const workout = await db.workouts.get(id);
    expect(workout).toBeDefined();
    expect(workout!.name).toMatch(/^Workout - \w+ \d+$/);
  });

  it('sets startedAt and no completedAt', async () => {
    const id = await workoutService.startWorkout();
    const workout = await db.workouts.get(id);
    expect(workout!.startedAt).toBeInstanceOf(Date);
    expect(workout!.completedAt).toBeUndefined();
  });
});

describe('addExercise', () => {
  it('adds an exercise with normalized name', async () => {
    const workoutId = await workoutService.startWorkout();
    const exId = await workoutService.addExercise(workoutId, 'bench press');

    const exercise = await db.workoutExercises.get(exId);
    expect(exercise!.exerciseName).toBe('Bench Press');
  });

  it('increments order for each exercise added', async () => {
    const workoutId = await workoutService.startWorkout();
    const id1 = await workoutService.addExercise(workoutId, 'squat');
    const id2 = await workoutService.addExercise(workoutId, 'bench press');

    const ex1 = await db.workoutExercises.get(id1);
    const ex2 = await db.workoutExercises.get(id2);
    expect(ex1!.order).toBe(1);
    expect(ex2!.order).toBe(2);
  });
});

describe('logSet', () => {
  it('creates a set with auto-incremented setNumber', async () => {
    const workoutId = await workoutService.startWorkout();
    const exId = await workoutService.addExercise(workoutId, 'squat');

    const setId1 = await workoutService.logSet(exId, 135, 10);
    const setId2 = await workoutService.logSet(exId, 135, 8);

    const set1 = await db.workoutSets.get(setId1);
    const set2 = await db.workoutSets.get(setId2);
    expect(set1!.setNumber).toBe(1);
    expect(set2!.setNumber).toBe(2);
  });

  it('sets timestamp to current time (LOG-04)', async () => {
    const workoutId = await workoutService.startWorkout();
    const exId = await workoutService.addExercise(workoutId, 'squat');

    const before = new Date();
    const setId = await workoutService.logSet(exId, 135, 10);
    const after = new Date();

    const set = await db.workoutSets.get(setId);
    expect(set!.timestamp).toBeInstanceOf(Date);
    expect(set!.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(set!.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

describe('updateSet', () => {
  it('updates weight and reps of an existing set (LOG-05)', async () => {
    const workoutId = await workoutService.startWorkout();
    const exId = await workoutService.addExercise(workoutId, 'squat');
    const setId = await workoutService.logSet(exId, 135, 10);

    await workoutService.updateSet(setId, 145, 8);

    const set = await db.workoutSets.get(setId);
    expect(set!.weight).toBe(145);
    expect(set!.reps).toBe(8);
  });
});

describe('deleteSet', () => {
  it('removes a set from the database (LOG-05)', async () => {
    const workoutId = await workoutService.startWorkout();
    const exId = await workoutService.addExercise(workoutId, 'squat');
    const setId = await workoutService.logSet(exId, 135, 10);

    await workoutService.deleteSet(setId);

    const set = await db.workoutSets.get(setId);
    expect(set).toBeUndefined();
  });
});

describe('getActiveWorkout', () => {
  it('returns the workout without completedAt', async () => {
    const id = await workoutService.startWorkout();
    const active = await workoutService.getActiveWorkout();
    expect(active).toBeDefined();
    expect(active!.id).toBe(id);
  });

  it('returns undefined when no active workout exists', async () => {
    const id = await workoutService.startWorkout();
    await workoutService.finishWorkout(id);
    const active = await workoutService.getActiveWorkout();
    expect(active).toBeUndefined();
  });
});

describe('finishWorkout', () => {
  it('sets completedAt to current time (D-26)', async () => {
    const id = await workoutService.startWorkout();

    const before = new Date();
    await workoutService.finishWorkout(id);
    const after = new Date();

    const workout = await db.workouts.get(id);
    expect(workout!.completedAt).toBeInstanceOf(Date);
    expect(workout!.completedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(workout!.completedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

describe('getLastSetValues', () => {
  it('returns weight and reps from most recent set for exercise (LOG-02)', async () => {
    const workoutId = await workoutService.startWorkout();
    const exId = await workoutService.addExercise(workoutId, 'bench press');
    await workoutService.logSet(exId, 135, 10);
    await workoutService.logSet(exId, 145, 8);

    const values = await workoutService.getLastSetValues('Bench Press');
    expect(values).toEqual({ weight: 145, reps: 8 });
  });

  it('returns null when no sets exist for exercise', async () => {
    const values = await workoutService.getLastSetValues('Deadlift');
    expect(values).toBeNull();
  });
});

describe('getExerciseNames', () => {
  it('returns unique exercise names from history (D-18)', async () => {
    const w1 = await workoutService.startWorkout();
    await workoutService.addExercise(w1, 'squat');
    await workoutService.addExercise(w1, 'bench press');
    await workoutService.addExercise(w1, 'squat'); // duplicate

    const names = await workoutService.getExerciseNames();
    expect(names).toContain('Squat');
    expect(names).toContain('Bench Press');
    // uniqueKeys returns unique values
    expect(names.filter(n => n === 'Squat').length).toBe(1);
  });
});
