import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/database';
import { uuid } from '../db/models';
import { workoutService, normalizeExerciseName } from './workoutService';

beforeEach(async () => {
  await db.delete();
  await db.open();
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
    expect(id).toBeTypeOf('string');

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
  it('soft-deletes a set (LOG-05)', async () => {
    const workoutId = await workoutService.startWorkout();
    const exId = await workoutService.addExercise(workoutId, 'squat');
    const setId = await workoutService.logSet(exId, 135, 10);

    await workoutService.deleteSet(setId);

    const set = await db.workoutSets.get(setId);
    expect(set).toBeDefined();
    expect(set!.deleted).toBe(true);
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

describe('updateWorkoutName', () => {
  it('changes workout name in DB', async () => {
    const id = await workoutService.startWorkout();
    await workoutService.updateWorkoutName(id, 'Push Day');
    const workout = await db.workouts.get(id);
    expect(workout!.name).toBe('Push Day');
  });
});

describe('getWorkoutVolume', () => {
  it('returns sum of weight * reps for all sets in a workout', async () => {
    const wId = await workoutService.startWorkout();
    const ex1 = await workoutService.addExercise(wId, 'squat');
    const ex2 = await workoutService.addExercise(wId, 'bench press');
    await workoutService.logSet(ex1, 100, 10); // 1000
    await workoutService.logSet(ex1, 100, 8);  // 800
    await workoutService.logSet(ex2, 50, 10);  // 500
    const volume = await workoutService.getWorkoutVolume(wId);
    expect(volume).toBe(2300);
  });

  it('returns 0 for workout with no sets', async () => {
    const wId = await workoutService.startWorkout();
    const volume = await workoutService.getWorkoutVolume(wId);
    expect(volume).toBe(0);
  });
});

describe('getRecentWorkouts', () => {
  it('returns completed workouts sorted by startedAt desc with totalVolume', async () => {
    // Create two completed workouts with distinct startedAt times
    const w1 = uuid();
    await db.workouts.add({
      id: w1,
      name: 'Workout 1',
      startedAt: new Date('2026-04-01T10:00:00'),
      completedAt: new Date('2026-04-01T11:00:00'),
      updatedAt: new Date(),
      deleted: false,
    });
    const ex1 = await workoutService.addExercise(w1, 'squat');
    await workoutService.logSet(ex1, 100, 10); // 1000

    const w2 = uuid();
    await db.workouts.add({
      id: w2,
      name: 'Workout 2',
      startedAt: new Date('2026-04-02T10:00:00'),
      completedAt: new Date('2026-04-02T11:00:00'),
      updatedAt: new Date(),
      deleted: false,
    });
    const ex2 = await workoutService.addExercise(w2, 'bench press');
    await workoutService.logSet(ex2, 50, 10); // 500

    const recent = await workoutService.getRecentWorkouts(10);
    expect(recent.length).toBe(2);
    // Most recent first (w2 started after w1)
    expect(recent[0].id).toBe(w2);
    expect(recent[1].id).toBe(w1);
    expect(recent[0].totalVolume).toBe(500);
    expect(recent[1].totalVolume).toBe(1000);
  });

  it('returns empty array when no completed workouts exist', async () => {
    await workoutService.startWorkout(); // active, not completed
    const recent = await workoutService.getRecentWorkouts(10);
    expect(recent).toEqual([]);
  });

  it('respects limit parameter', async () => {
    for (let i = 0; i < 5; i++) {
      const w = await workoutService.startWorkout();
      await workoutService.finishWorkout(w);
    }
    const recent = await workoutService.getRecentWorkouts(3);
    expect(recent.length).toBe(3);
  });
});

describe('startWorkoutFromTemplate', () => {
  it('creates a workout with template exercises pre-loaded', async () => {
    // Manually create a template
    await db.workoutTemplates.add({
      id: uuid(),
      name: 'Push Day',
      lastUsed: new Date(),
      exercises: ['Bench Press', 'Overhead Press', 'Tricep Dips'],
      updatedAt: new Date(),
      deleted: false,
    });

    const wId = await workoutService.startWorkoutFromTemplate('Push Day');
    const workout = await db.workouts.get(wId);
    expect(workout!.name).toBe('Push Day');

    const exercises = await db.workoutExercises
      .where('workoutId').equals(wId)
      .sortBy('order');
    expect(exercises.length).toBe(3);
    expect(exercises[0].exerciseName).toBe('Bench Press');
    expect(exercises[1].exerciseName).toBe('Overhead Press');
    expect(exercises[2].exerciseName).toBe('Tricep Dips');
  });

  it('creates an empty workout when template does not exist', async () => {
    const wId = await workoutService.startWorkoutFromTemplate('Nonexistent');
    const workout = await db.workouts.get(wId);
    expect(workout!.name).toBe('Nonexistent');

    const exercises = await db.workoutExercises
      .where('workoutId').equals(wId).toArray();
    expect(exercises.length).toBe(0);
  });
});

describe('upsertTemplate (via finishWorkout)', () => {
  it('creates a new template when finishing a workout', async () => {
    const wId = await workoutService.startWorkout();
    await workoutService.updateWorkoutName(wId, 'Leg Day');
    await workoutService.addExercise(wId, 'squat');
    await workoutService.addExercise(wId, 'leg press');
    await workoutService.finishWorkout(wId);

    const template = await db.workoutTemplates
      .where('name').equals('Leg Day').first();
    expect(template).toBeDefined();
    expect(template!.exercises).toEqual(['Squat', 'Leg Press']);
    expect(template!.lastUsed).toBeInstanceOf(Date);
  });

  it('updates existing template exercises and lastUsed', async () => {
    // First workout creates template
    const w1 = await workoutService.startWorkout();
    await workoutService.updateWorkoutName(w1, 'Push Day');
    await workoutService.addExercise(w1, 'bench press');
    await workoutService.finishWorkout(w1);

    // Second workout updates template
    const w2 = await workoutService.startWorkout();
    await workoutService.updateWorkoutName(w2, 'Push Day');
    await workoutService.addExercise(w2, 'bench press');
    await workoutService.addExercise(w2, 'overhead press');
    await workoutService.finishWorkout(w2);

    const templates = await db.workoutTemplates
      .where('name').equals('Push Day').toArray();
    expect(templates.length).toBe(1);
    expect(templates[0].exercises).toEqual(['Bench Press', 'Overhead Press']);
  });

  it('integration: finish creates template, startFromTemplate uses it', async () => {
    // Create and finish a workout
    const w1 = await workoutService.startWorkout();
    await workoutService.updateWorkoutName(w1, 'Full Body');
    await workoutService.addExercise(w1, 'squat');
    await workoutService.addExercise(w1, 'bench press');
    await workoutService.addExercise(w1, 'deadlift');
    await workoutService.finishWorkout(w1);

    // Start from template
    const w2 = await workoutService.startWorkoutFromTemplate('Full Body');
    const workout = await db.workouts.get(w2);
    expect(workout!.name).toBe('Full Body');

    const exercises = await db.workoutExercises
      .where('workoutId').equals(w2)
      .sortBy('order');
    expect(exercises.length).toBe(3);
    expect(exercises[0].exerciseName).toBe('Squat');
    expect(exercises[1].exerciseName).toBe('Bench Press');
    expect(exercises[2].exerciseName).toBe('Deadlift');
  });
});

describe('getCompletedWorkouts', () => {
  it('returns completed workouts sorted by completedAt descending', async () => {
    const w1 = uuid();
    await db.workouts.add({
      id: w1,
      name: 'Workout 1',
      startedAt: new Date('2026-04-01T10:00:00'),
      completedAt: new Date('2026-04-01T11:00:00'),
      updatedAt: new Date(),
      deleted: false,
    });
    const ex1 = await workoutService.addExercise(w1, 'squat');
    await workoutService.logSet(ex1, 100, 10);

    const w2 = uuid();
    await db.workouts.add({
      id: w2,
      name: 'Workout 2',
      startedAt: new Date('2026-04-02T10:00:00'),
      completedAt: new Date('2026-04-02T11:00:00'),
      updatedAt: new Date(),
      deleted: false,
    });
    const ex2 = await workoutService.addExercise(w2, 'bench press');
    await workoutService.logSet(ex2, 50, 10);

    const results = await workoutService.getCompletedWorkouts(0, 20);
    expect(results.length).toBe(2);
    // Most recent completedAt first
    expect(results[0].id).toBe(w2);
    expect(results[1].id).toBe(w1);
    expect(results[0].totalVolume).toBe(500);
    expect(results[1].totalVolume).toBe(1000);
  });

  it('excludes active workouts', async () => {
    const w1 = await workoutService.startWorkout();
    await workoutService.finishWorkout(w1);
    await workoutService.startWorkout(); // active, not completed

    const results = await workoutService.getCompletedWorkouts(0, 20);
    expect(results.length).toBe(1);
  });

  it('paginates with offset and limit', async () => {
    // Create 5 completed workouts
    for (let i = 0; i < 5; i++) {
      const w = await workoutService.startWorkout();
      await workoutService.finishWorkout(w);
    }

    const page1 = await workoutService.getCompletedWorkouts(0, 2);
    expect(page1.length).toBe(2);

    const page2 = await workoutService.getCompletedWorkouts(2, 2);
    expect(page2.length).toBe(2);

    const page3 = await workoutService.getCompletedWorkouts(4, 2);
    expect(page3.length).toBe(1);
  });

  it('returns empty array when no completed workouts exist', async () => {
    await workoutService.startWorkout(); // active
    const results = await workoutService.getCompletedWorkouts(0, 20);
    expect(results).toEqual([]);
  });
});

describe('getWorkoutDetail', () => {
  it('returns workout with exercises, sets, volumes, and duration', async () => {
    const wId = await workoutService.startWorkout();
    await workoutService.updateWorkoutName(wId, 'Test Workout');
    const ex1 = await workoutService.addExercise(wId, 'squat');
    const ex2 = await workoutService.addExercise(wId, 'bench press');
    await workoutService.logSet(ex1, 100, 10); // 1000
    await workoutService.logSet(ex1, 100, 8);  // 800
    await workoutService.logSet(ex2, 50, 10);  // 500
    await workoutService.finishWorkout(wId);

    const detail = await workoutService.getWorkoutDetail(wId);
    expect(detail).not.toBeNull();
    expect(detail!.name).toBe('Test Workout');
    expect(detail!.totalVolume).toBe(2300);
    expect(detail!.exercises.length).toBe(2);
    expect(detail!.exercises[0].exerciseName).toBe('Squat');
    expect(detail!.exercises[0].volume).toBe(1800);
    expect(detail!.exercises[0].sets.length).toBe(2);
    expect(detail!.exercises[1].exerciseName).toBe('Bench Press');
    expect(detail!.exercises[1].volume).toBe(500);
  });

  it('returns null for non-existent workout', async () => {
    const detail = await workoutService.getWorkoutDetail(uuid());
    expect(detail).toBeNull();
  });

  it('returns null for active (not completed) workout', async () => {
    const wId = await workoutService.startWorkout();
    const detail = await workoutService.getWorkoutDetail(wId);
    expect(detail).toBeNull();
  });

  it('returns null duration when workout has 0 sets', async () => {
    const wId = await workoutService.startWorkout();
    await workoutService.addExercise(wId, 'squat');
    await workoutService.finishWorkout(wId);

    const detail = await workoutService.getWorkoutDetail(wId);
    expect(detail).not.toBeNull();
    expect(detail!.duration).toBeNull();
  });

  it('returns 0 duration when workout has 1 set', async () => {
    const wId = await workoutService.startWorkout();
    const ex = await workoutService.addExercise(wId, 'squat');
    await workoutService.logSet(ex, 100, 10);
    await workoutService.finishWorkout(wId);

    const detail = await workoutService.getWorkoutDetail(wId);
    expect(detail).not.toBeNull();
    expect(detail!.duration).toBe(0);
  });
});

describe('getExerciseHistory', () => {
  it('returns sessions sorted by date descending with setCount, totalVolume, sets', async () => {
    // Workout 1 with bench press
    const w1 = await workoutService.startWorkout();
    const ex1 = await workoutService.addExercise(w1, 'bench press');
    await workoutService.logSet(ex1, 100, 10);
    await workoutService.logSet(ex1, 100, 8);
    await workoutService.finishWorkout(w1);

    // Workout 2 with bench press
    const w2 = await workoutService.startWorkout();
    const ex2 = await workoutService.addExercise(w2, 'bench press');
    await workoutService.logSet(ex2, 110, 10);
    await workoutService.finishWorkout(w2);

    const history = await workoutService.getExerciseHistory('Bench Press');
    expect(history.length).toBe(2);
    // Most recent first
    expect(history[0].workoutId).toBe(w2);
    expect(history[0].setCount).toBe(1);
    expect(history[0].totalVolume).toBe(1100);
    expect(history[0].sets.length).toBe(1);
    expect(history[1].workoutId).toBe(w1);
    expect(history[1].setCount).toBe(2);
    expect(history[1].totalVolume).toBe(1800);
  });

  it('excludes sessions from active workouts', async () => {
    const w1 = await workoutService.startWorkout();
    const ex1 = await workoutService.addExercise(w1, 'squat');
    await workoutService.logSet(ex1, 100, 10);
    await workoutService.finishWorkout(w1);

    // Active workout with squat
    const w2 = await workoutService.startWorkout();
    const ex2 = await workoutService.addExercise(w2, 'squat');
    await workoutService.logSet(ex2, 110, 10);

    const history = await workoutService.getExerciseHistory('Squat');
    expect(history.length).toBe(1);
    expect(history[0].workoutId).toBe(w1);
  });

  it('respects limit parameter', async () => {
    for (let i = 0; i < 5; i++) {
      const w = await workoutService.startWorkout();
      const ex = await workoutService.addExercise(w, 'squat');
      await workoutService.logSet(ex, 100 + i * 10, 10);
      await workoutService.finishWorkout(w);
    }

    const history = await workoutService.getExerciseHistory('Squat', 3);
    expect(history.length).toBe(3);
  });
});

describe('getWorkoutVolumeChartData', () => {
  it('returns date/volume pairs sorted chronologically (oldest first)', async () => {
    const w1 = await workoutService.startWorkout();
    const ex1 = await workoutService.addExercise(w1, 'squat');
    await workoutService.logSet(ex1, 100, 10); // 1000
    await workoutService.finishWorkout(w1);

    const w2 = await workoutService.startWorkout();
    const ex2 = await workoutService.addExercise(w2, 'bench press');
    await workoutService.logSet(ex2, 50, 10); // 500
    await workoutService.finishWorkout(w2);

    const data = await workoutService.getWorkoutVolumeChartData(20);
    expect(data.length).toBe(2);
    // Chronological order (oldest first for chart)
    expect(data[0].volume).toBe(1000);
    expect(data[1].volume).toBe(500);
    // Check date format
    expect(data[0].date).toBeTruthy();
    expect(data[0].fullDate).toBeTruthy();
  });
});
