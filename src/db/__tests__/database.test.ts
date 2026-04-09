import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db, MoarDatabase } from '../database';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('MoarDatabase', () => {
  it('is a Dexie instance', () => {
    expect(db).toBeInstanceOf(MoarDatabase);
  });

  it('creates and reads a Workout', async () => {
    const id = await db.workouts.add({
      name: 'Push Day',
      startedAt: new Date('2026-04-08'),
    });
    const workout = await db.workouts.get(id);
    expect(workout).toBeDefined();
    expect(workout!.name).toBe('Push Day');
    expect(workout!.startedAt).toEqual(new Date('2026-04-08'));
    expect(workout!.id).toBe(id);
  });

  it('creates a WorkoutExercise linked to a workout and queries by workoutId', async () => {
    const workoutId = await db.workouts.add({
      name: 'Leg Day',
      startedAt: new Date('2026-04-08'),
    });

    await db.workoutExercises.add({
      workoutId,
      exerciseName: 'Squat',
      order: 1,
    });
    await db.workoutExercises.add({
      workoutId,
      exerciseName: 'Leg Press',
      order: 2,
    });

    const exercises = await db.workoutExercises
      .where('workoutId')
      .equals(workoutId)
      .toArray();

    expect(exercises).toHaveLength(2);
    expect(exercises[0].exerciseName).toBe('Squat');
    expect(exercises[1].exerciseName).toBe('Leg Press');
  });

  it('creates a WorkoutSet linked to a WorkoutExercise and queries by workoutExerciseId', async () => {
    const workoutId = await db.workouts.add({
      name: 'Push Day',
      startedAt: new Date('2026-04-08'),
    });
    const exerciseId = await db.workoutExercises.add({
      workoutId,
      exerciseName: 'Bench Press',
      order: 1,
    });

    await db.workoutSets.add({
      workoutExerciseId: exerciseId,
      setNumber: 1,
      weight: 135,
      reps: 10,
      timestamp: new Date('2026-04-08T10:00:00'),
    });
    await db.workoutSets.add({
      workoutExerciseId: exerciseId,
      setNumber: 2,
      weight: 155,
      reps: 8,
      timestamp: new Date('2026-04-08T10:03:00'),
    });

    const sets = await db.workoutSets
      .where('workoutExerciseId')
      .equals(exerciseId)
      .toArray();

    expect(sets).toHaveLength(2);
    expect(sets[0].weight).toBe(135);
    expect(sets[0].reps).toBe(10);
    expect(sets[1].weight).toBe(155);
    expect(sets[1].reps).toBe(8);
  });

  it('creates and reads a WorkoutTemplate', async () => {
    const id = await db.workoutTemplates.add({
      name: 'PPL Push',
      lastUsed: new Date('2026-04-07'),
      exercises: ['Bench Press', 'OHP', 'Tricep Pushdown'],
    });
    const template = await db.workoutTemplates.get(id);
    expect(template).toBeDefined();
    expect(template!.name).toBe('PPL Push');
    expect(template!.exercises).toEqual(['Bench Press', 'OHP', 'Tricep Pushdown']);
    expect(template!.lastUsed).toEqual(new Date('2026-04-07'));
  });
});
