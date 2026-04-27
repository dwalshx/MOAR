import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/database';
import { workoutService } from './workoutService';
import {
  classifySet,
  suggestTarget,
  getSetBadgesForExercise,
  generateWorkoutSummary,
} from './comparisonService';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

// Helper: create a completed workout with exercises and sets
async function createCompletedWorkout(
  name: string,
  exercises: { name: string; sets: { weight: number; reps: number }[] }[],
): Promise<string> {
  const wId = await workoutService.startWorkout();
  await workoutService.updateWorkoutName(wId, name);
  for (const ex of exercises) {
    const exId = await workoutService.addExercise(wId, ex.name);
    for (const s of ex.sets) {
      await workoutService.logSet(exId, s.weight, s.reps);
    }
  }
  await workoutService.finishWorkout(wId);
  return wId;
}

// Helper: create an active (incomplete) workout
async function createActiveWorkout(
  name: string,
  exercises: { name: string; sets: { weight: number; reps: number }[] }[],
): Promise<string> {
  const wId = await workoutService.startWorkout();
  await workoutService.updateWorkoutName(wId, name);
  for (const ex of exercises) {
    const exId = await workoutService.addExercise(wId, ex.name);
    for (const s of ex.sets) {
      await workoutService.logSet(exId, s.weight, s.reps);
    }
  }
  return wId;
}

describe('classifySet', () => {
  it('returns PR when weight x reps combo never done before and has completed history', () => {
    const lastSessionSets = [{ setNumber: 1, weight: 135, reps: 8 }];
    const allHistoricalSets = [{ weight: 135, reps: 8 }, { weight: 135, reps: 10 }];
    // 145 x 8 is a new combo
    const result = classifySet(145, 8, 1, lastSessionSets, allHistoricalSets, true);
    expect(result).toBe('PR');
  });

  it('returns null (not PR) when hasCompletedHistory is false', () => {
    const lastSessionSets: { setNumber: number; weight: number; reps: number }[] = [];
    const allHistoricalSets: { weight: number; reps: number }[] = [];
    // Even though 135x10 is "new", no prior history means no PR
    const result = classifySet(135, 10, 1, lastSessionSets, allHistoricalSets, false);
    expect(result).toBeNull();
  });

  it('returns null when weight is 0', () => {
    const result = classifySet(0, 10, 1, [], [], true);
    expect(result).toBeNull();
  });

  it('returns null when reps is 0', () => {
    const result = classifySet(135, 0, 1, [], [], true);
    expect(result).toBeNull();
  });

  it('returns +1 when same weight and more reps than last session same set number', () => {
    const lastSessionSets = [{ setNumber: 1, weight: 135, reps: 8 }];
    const allHistoricalSets = [{ weight: 135, reps: 8 }, { weight: 135, reps: 9 }];
    // 135 x 9 exists in history so not PR, but beats last session set 1 (135x8)
    const result = classifySet(135, 9, 1, lastSessionSets, allHistoricalSets, true);
    expect(result).toBe('+1');
  });

  it('returns +1 when same reps and higher weight than last session same set number', () => {
    const lastSessionSets = [{ setNumber: 1, weight: 135, reps: 8 }];
    const allHistoricalSets = [{ weight: 135, reps: 8 }, { weight: 140, reps: 8 }];
    // 140 x 8 exists in history so not PR, but beats last session set 1 (135x8)
    const result = classifySet(140, 8, 1, lastSessionSets, allHistoricalSets, true);
    expect(result).toBe('+1');
  });

  it('returns Matched when exact same weight and reps as last session same set number', () => {
    const lastSessionSets = [{ setNumber: 1, weight: 135, reps: 8 }];
    const allHistoricalSets = [{ weight: 135, reps: 8 }];
    const result = classifySet(135, 8, 1, lastSessionSets, allHistoricalSets, true);
    expect(result).toBe('Matched');
  });

  it('returns null when no last session entry matches set number (extra set)', () => {
    const lastSessionSets = [{ setNumber: 1, weight: 135, reps: 8 }];
    const allHistoricalSets = [{ weight: 135, reps: 8 }, { weight: 135, reps: 10 }];
    // Set number 2 has no match in last session
    const result = classifySet(135, 10, 2, lastSessionSets, allHistoricalSets, true);
    // Not PR because 135x10 exists in history
    expect(result).toBeNull();
  });

  it('PR wins over +1 when both apply (priority order)', () => {
    const lastSessionSets = [{ setNumber: 1, weight: 135, reps: 8 }];
    // 135x10 NOT in history, so it's a PR. Also beats last session (more reps), so +1.
    const allHistoricalSets = [{ weight: 135, reps: 8 }];
    const result = classifySet(135, 10, 1, lastSessionSets, allHistoricalSets, true);
    expect(result).toBe('PR');
  });
});

describe('suggestTarget', () => {
  it('returns nudge text with +1 rep and +5 lbs from first set of last session', () => {
    const lastSessionSets = [
      { setNumber: 1, weight: 135, reps: 8 },
      { setNumber: 2, weight: 135, reps: 7 },
    ];
    const result = suggestTarget(lastSessionSets);
    expect(result).toBe('Last time set 1: 135 x 8. Try 135 x 9 or 140 x 8');
  });

  it('returns null when lastSessionSets is empty', () => {
    const result = suggestTarget([]);
    expect(result).toBeNull();
  });

  it('uses +5 for weight suggestion', () => {
    const lastSessionSets = [{ setNumber: 1, weight: 200, reps: 5 }];
    const result = suggestTarget(lastSessionSets);
    expect(result).toBe('Last time set 1: 200 x 5. Try 200 x 6 or 205 x 5');
  });

  it('points at the matching set number when given a current set', () => {
    const lastSessionSets = [
      { setNumber: 1, weight: 135, reps: 10 },
      { setNumber: 2, weight: 135, reps: 8 },
      { setNumber: 3, weight: 135, reps: 6 },
    ];
    const result = suggestTarget(lastSessionSets, 2);
    expect(result).toBe('Last time set 2: 135 x 8. Try 135 x 9 or 140 x 8');
  });

  it('falls back to last available set when current set has no match', () => {
    const lastSessionSets = [
      { setNumber: 1, weight: 100, reps: 10 },
      { setNumber: 2, weight: 100, reps: 8 },
    ];
    const result = suggestTarget(lastSessionSets, 5);
    expect(result).toBe('Last time: 100 x 8. Try 100 x 9 or 105 x 8');
  });
});

describe('getSetBadgesForExercise', () => {
  it('returns badges for each set by comparing to last completed workout', async () => {
    // Create a completed workout with Bench Press 135x8, 135x7
    await createCompletedWorkout('Push Day', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 8 }, { weight: 135, reps: 7 }] },
    ]);

    // Create active workout with Bench Press 135x9 (beats set 1), 135x7 (matches set 2)
    const activeWId = await createActiveWorkout('Push Day', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 9 }, { weight: 135, reps: 7 }] },
    ]);

    const exercises = await db.workoutExercises.where('workoutId').equals(activeWId).toArray();
    const result = await getSetBadgesForExercise(exercises[0].id, activeWId);

    // Should have badges for both sets
    expect(result.badges.size).toBe(2);

    // Get sets sorted by setNumber (UUID ordering isn't natural like auto-increment)
    const sets = await db.workoutSets.where('workoutExerciseId').equals(exercises[0].id).sortBy('setNumber');
    // Set 1: 135x9 -- never done before in history, so PR
    expect(result.badges.get(sets[0].id)).toBe('PR');
    // Set 2: 135x7 -- matched (same as last session set 2)
    expect(result.badges.get(sets[1].id)).toBe('Matched');
    expect(result.isComeback).toBe(false);
  });

  it('returns all historical sets for PR detection', async () => {
    // Create two completed workouts with different combos
    await createCompletedWorkout('Push Day', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 8 }] },
    ]);
    await createCompletedWorkout('Push Day', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 10 }] },
    ]);

    // Active workout: 135x10 -- not a PR because it was done in second completed workout
    const activeWId = await createActiveWorkout('Push Day', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 10 }] },
    ]);

    const exercises = await db.workoutExercises.where('workoutId').equals(activeWId).toArray();
    const result = await getSetBadgesForExercise(exercises[0].id!, activeWId);

    const sets = await db.workoutSets.where('workoutExerciseId').equals(exercises[0].id!).toArray();
    expect(result.badges.get(sets[0].id!)).toBe('Matched');
  });

  it('returns isComeback when exercise not in last workout but exists in older one', async () => {
    // First workout: Bench Press
    await createCompletedWorkout('Push Day', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 8 }] },
    ]);
    // Second workout: only Squat (no Bench Press)
    await createCompletedWorkout('Leg Day', [
      { name: 'Squat', sets: [{ weight: 225, reps: 5 }] },
    ]);

    // Active workout: Bench Press again -- comeback
    const activeWId = await createActiveWorkout('Push Day', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 8 }] },
    ]);

    const exercises = await db.workoutExercises.where('workoutId').equals(activeWId).toArray();
    const result = await getSetBadgesForExercise(exercises[0].id!, activeWId);

    expect(result.isComeback).toBe(true);
  });
});

describe('generateWorkoutSummary', () => {
  it('returns volume comparison, exercise directions, win count, and best achievement', async () => {
    // Previous completed workout: Bench 135x10 (1350), Squat 225x5 (1125) = 2475
    await createCompletedWorkout('Full Body', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 10 }] },
      { name: 'Squat', sets: [{ weight: 225, reps: 5 }] },
    ]);

    // Active workout: Bench 135x12 (1620), Squat 225x5 (1125) = 2745
    const activeWId = await createActiveWorkout('Full Body', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 12 }] },
      { name: 'Squat', sets: [{ weight: 225, reps: 5 }] },
    ]);

    const summary = await generateWorkoutSummary(activeWId);

    expect(summary.totalVolume).toBe(2745);
    expect(summary.previousTotalVolume).toBe(2475);
    expect(summary.volumeChangePercent).toBeCloseTo(10.91, 1);
    expect(summary.totalExercises).toBe(2);
    expect(summary.exercises.length).toBe(2);
  });

  it('exercise direction is up when current volume > previous', async () => {
    await createCompletedWorkout('Push Day', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 8 }] },
    ]);
    const activeWId = await createActiveWorkout('Push Day', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 10 }] },
    ]);

    const summary = await generateWorkoutSummary(activeWId);
    const bench = summary.exercises.find(e => e.exerciseName === 'Bench Press');
    expect(bench!.direction).toBe('up');
  });

  it('exercise direction is down when current volume < previous', async () => {
    await createCompletedWorkout('Push Day', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 10 }] },
    ]);
    const activeWId = await createActiveWorkout('Push Day', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 6 }] },
    ]);

    const summary = await generateWorkoutSummary(activeWId);
    const bench = summary.exercises.find(e => e.exerciseName === 'Bench Press');
    expect(bench!.direction).toBe('down');
  });

  it('exercise direction is same when current volume equals previous', async () => {
    await createCompletedWorkout('Push Day', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 8 }] },
    ]);
    const activeWId = await createActiveWorkout('Push Day', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 8 }] },
    ]);

    const summary = await generateWorkoutSummary(activeWId);
    const bench = summary.exercises.find(e => e.exerciseName === 'Bench Press');
    expect(bench!.direction).toBe('same');
  });

  it('exercise direction is new when no previous session for that exercise', async () => {
    // Previous workout has Squat but not Bench
    await createCompletedWorkout('Mixed', [
      { name: 'Squat', sets: [{ weight: 225, reps: 5 }] },
    ]);
    const activeWId = await createActiveWorkout('Mixed', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 8 }] },
    ]);

    const summary = await generateWorkoutSummary(activeWId);
    const bench = summary.exercises.find(e => e.exerciseName === 'Bench Press');
    expect(bench!.direction).toBe('new');
  });

  it('winCount counts exercises with direction up', async () => {
    await createCompletedWorkout('Full Body', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 8 }] },
      { name: 'Squat', sets: [{ weight: 225, reps: 5 }] },
      { name: 'Deadlift', sets: [{ weight: 315, reps: 3 }] },
    ]);
    // Bench up, Squat same, Deadlift down
    const activeWId = await createActiveWorkout('Full Body', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 10 }] },
      { name: 'Squat', sets: [{ weight: 225, reps: 5 }] },
      { name: 'Deadlift', sets: [{ weight: 315, reps: 2 }] },
    ]);

    const summary = await generateWorkoutSummary(activeWId);
    expect(summary.winCount).toBe(1);
  });

  it('bestAchievement is a PR description when PRs exist', async () => {
    await createCompletedWorkout('Push Day', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 8 }] },
    ]);
    // 135x10 is a new combo -> PR
    const activeWId = await createActiveWorkout('Push Day', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 10 }] },
    ]);

    const summary = await generateWorkoutSummary(activeWId);
    expect(summary.bestAchievement).toBeTruthy();
    expect(summary.bestAchievement).toContain('PR');
  });

  it('first-time workout returns null for previousTotalVolume and volumeChangePercent', async () => {
    // No previous workout with same name
    const activeWId = await createActiveWorkout('Brand New Workout', [
      { name: 'Bench Press', sets: [{ weight: 135, reps: 8 }] },
    ]);

    const summary = await generateWorkoutSummary(activeWId);
    expect(summary.previousTotalVolume).toBeNull();
    expect(summary.volumeChangePercent).toBeNull();
    expect(summary.exercises[0].direction).toBe('new');
    expect(summary.bestAchievement).toBeTruthy(); // congratulatory message
  });
});
