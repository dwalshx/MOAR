import { db } from '../db/database';
import { setVolume } from '../utils/formatters';
import { settingsService } from './settingsService';

// --- Types ---

export type BadgeType = 'PR' | '+1' | 'Matched' | 'Volume Up' | 'Comeback';

export interface SetBadge {
  type: BadgeType;
}

export interface ExerciseComparison {
  exerciseName: string;
  currentVolume: number;
  previousVolume: number | null;
  direction: 'up' | 'down' | 'same' | 'new';
  setBadges: Map<string, BadgeType>; // setId -> badge type
  isComeback: boolean;
}

export interface WorkoutSummary {
  totalVolume: number;
  previousTotalVolume: number | null;
  volumeChangePercent: number | null;
  exercises: ExerciseComparison[];
  winCount: number;
  totalExercises: number;
  bestAchievement: string | null;
  durationMinutes: number | null;
  intensity: number | null;          // lbs/min
  previousIntensity: number | null;
  intensityChangePercent: number | null;
}

export interface NudgeResult {
  text: string;
}

// --- Pure Functions ---

/**
 * Classify a single set against history.
 * Priority: PR > +1 > Matched > null
 * Volume Up and Comeback are exercise-level, not per-set.
 */
export function classifySet(
  weight: number,
  reps: number,
  setNumber: number,
  lastSessionSets: { setNumber: number; weight: number; reps: number }[],
  allHistoricalSets: { weight: number; reps: number }[],
  hasCompletedHistory: boolean,
): BadgeType | null {
  // No badge for zero weight or zero reps
  if (weight <= 0 || reps <= 0) return null;

  // No PR possible if no completed history exists (Pitfall 1: first-ever workout)
  if (!hasCompletedHistory) return null;

  // Check PR: exact weight x reps combo never done before
  const isNewCombo = !allHistoricalSets.some(
    s => s.weight === weight && s.reps === reps,
  );
  if (isNewCombo) return 'PR';

  // Check +1 and Matched against same set number from last session
  const lastSameSet = lastSessionSets.find(s => s.setNumber === setNumber);
  if (lastSameSet) {
    const beatReps = weight === lastSameSet.weight && reps > lastSameSet.reps;
    const beatWeight = reps === lastSameSet.reps && weight > lastSameSet.weight;
    if (beatReps || beatWeight) return '+1';

    if (weight === lastSameSet.weight && reps === lastSameSet.reps) return 'Matched';
  }

  return null;
}

/**
 * Suggest a target for the user's CURRENT set, based on what they did in the
 * matching set number from last session (or the closest if missing).
 *
 * @param lastSessionSets  All sets from the previous session of this exercise
 * @param currentSetNumber The set number the user is about to log (1-indexed).
 *                         If omitted, uses the first set (legacy behavior).
 *
 * Format: "Last time set N: {weight} x {reps}. Try {weight} x {reps+1} or {weight+5} x {reps}"
 */
export function suggestTarget(
  lastSessionSets: { setNumber: number; weight: number; reps: number }[],
  currentSetNumber: number = 1,
): string | null {
  if (lastSessionSets.length === 0) return null;

  const sorted = [...lastSessionSets].sort((a, b) => a.setNumber - b.setNumber);

  // Try to find the matching set number, fall back to last available set
  const target =
    sorted.find(s => s.setNumber === currentSetNumber) ??
    sorted[sorted.length - 1];

  const setLabel =
    sorted.find(s => s.setNumber === currentSetNumber)
      ? `Last time set ${currentSetNumber}`
      : 'Last time';

  return `${setLabel}: ${target.weight} x ${target.reps}. Try ${target.weight} x ${target.reps + 1} or ${target.weight + 5} x ${target.reps}`;
}

export interface ExercisePR {
  weight: number;
  reps: number;
  volume: number;
  date: Date;
}

/**
 * Get the all-time PR for an exercise (highest single-set volume: weight * reps).
 * Only considers completed workouts.
 */
/**
 * Get all-time PRs for every exercise the user has logged.
 * Returns one PR per exercise name (the heaviest single set by volume).
 * Sorted by date desc (most recent PRs first).
 */
export async function getAllPRs(): Promise<Array<{ exerciseName: string } & ExercisePR>> {
  // Get all unique exercise names from completed workouts
  const allEx = await db.workoutExercises.filter(e => !e.deleted).toArray();
  const names = [...new Set(allEx.map(e => e.exerciseName))];

  const prs: Array<{ exerciseName: string } & ExercisePR> = [];
  for (const name of names) {
    const pr = await getExercisePR(name);
    if (pr) prs.push({ exerciseName: name, ...pr });
  }

  // Most recent PRs first
  prs.sort((a, b) => b.date.getTime() - a.date.getTime());
  return prs;
}

export async function getExercisePR(exerciseName: string): Promise<ExercisePR | null> {
  const allExercises = await db.workoutExercises
    .where('exerciseName').equals(exerciseName)
    .filter(e => !e.deleted)
    .toArray();

  let best: ExercisePR | null = null;

  for (const ex of allExercises) {
    const workout = await db.workouts.get(ex.workoutId);
    if (!workout || !workout.completedAt || workout.deleted) continue;

    const sets = await db.workoutSets
      .where('workoutExerciseId').equals(ex.id)
      .filter(s => !s.deleted)
      .toArray();

    for (const s of sets) {
      const vol = setVolume(s.weight, s.reps, settingsService.getBodyWeight());
      if (vol > 0 && (!best || vol > best.volume)) {
        best = { weight: s.weight, reps: s.reps, volume: vol, date: workout.completedAt };
      }
    }
  }

  return best;
}

// --- Async Functions (DB queries) ---

/**
 * Get set badges for all sets of a workout exercise, comparing against history.
 * Also returns isComeback flag.
 */
export async function getSetBadgesForExercise(
  workoutExerciseId: string,
  currentWorkoutId: string,
): Promise<{ badges: Map<string, BadgeType>; isComeback: boolean }> {
  // 1. Get exercise record to find exerciseName
  const exerciseRecord = await db.workoutExercises.get(workoutExerciseId);
  if (!exerciseRecord) return { badges: new Map(), isComeback: false };

  const exerciseName = exerciseRecord.exerciseName;

  // 2. Find all workoutExercise records for this exerciseName (not deleted)
  const allExerciseRecords = await db.workoutExercises
    .where('exerciseName')
    .equals(exerciseName)
    .filter(e => !e.deleted)
    .toArray();

  // 3. Get parent workouts, filter to completed, exclude current and deleted
  const workoutIds = [...new Set(allExerciseRecords.map(e => e.workoutId))];
  const workouts = await Promise.all(workoutIds.map(id => db.workouts.get(id)));
  const completedWorkouts = workouts
    .filter((w): w is NonNullable<typeof w> => w != null && w.completedAt != null && w.id !== currentWorkoutId && !w.deleted)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());

  const hasCompletedHistory = completedWorkouts.length > 0;

  // 4. Find the most recent completed workout's exercise records
  let lastSessionSets: { setNumber: number; weight: number; reps: number }[] = [];

  if (completedWorkouts.length > 0) {
    const lastWorkout = completedWorkouts[0];
    const lastExerciseRecords = allExerciseRecords.filter(
      e => e.workoutId === lastWorkout.id,
    );
    if (lastExerciseRecords.length > 0) {
      const lastExIds = lastExerciseRecords.map(e => e.id);
      const lastSets = await db.workoutSets
        .where('workoutExerciseId')
        .anyOf(lastExIds)
        .filter(s => !s.deleted)
        .toArray();
      lastSessionSets = lastSets.map(s => ({
        setNumber: s.setNumber,
        weight: s.weight,
        reps: s.reps,
      }));
    }
  }

  // 5. Get ALL historical sets for PR detection (from completed workouts only)
  const completedExerciseIds = allExerciseRecords
    .filter(e => {
      const w = completedWorkouts.find(cw => cw.id === e.workoutId);
      return w != null;
    })
    .map(e => e.id);

  let allHistoricalSets: { weight: number; reps: number }[] = [];
  if (completedExerciseIds.length > 0) {
    const historicalSetsRaw = await db.workoutSets
      .where('workoutExerciseId')
      .anyOf(completedExerciseIds)
      .filter(s => !s.deleted)
      .toArray();
    allHistoricalSets = historicalSetsRaw.map(s => ({
      weight: s.weight,
      reps: s.reps,
    }));
  }

  // 6. Get current sets and classify each
  const currentSets = await db.workoutSets
    .where('workoutExerciseId')
    .equals(workoutExerciseId)
    .filter(s => !s.deleted)
    .sortBy('setNumber');

  const badges = new Map<string, BadgeType>();
  for (const set of currentSets) {
    const badge = classifySet(
      set.weight,
      set.reps,
      set.setNumber,
      lastSessionSets,
      allHistoricalSets,
      hasCompletedHistory,
    );
    if (badge) {
      badges.set(set.id, badge);
    }
  }

  // 7. Check isComeback: exercise not in last completed workout (overall) but in an older one
  let isComeback = false;
  // Get ALL completed workouts (not just those with this exercise) to find the true "last workout"
  const allWorkoutsForComeback = await db.workouts.filter(w => !w.deleted).toArray();
  const allCompletedSorted = allWorkoutsForComeback
    .filter(w => w.completedAt != null && w.id !== currentWorkoutId)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());

  if (allCompletedSorted.length > 0 && hasCompletedHistory) {
    const lastOverallWorkout = allCompletedSorted[0];
    // Check if this exercise was in the last completed workout
    const lastWorkoutExercises = await db.workoutExercises
      .where('workoutId')
      .equals(lastOverallWorkout.id)
      .filter(e => !e.deleted)
      .toArray();
    const lastWorkoutExerciseNames = lastWorkoutExercises.map(e => e.exerciseName);

    if (!lastWorkoutExerciseNames.includes(exerciseName)) {
      // Exercise wasn't in the last workout but we know it has completed history
      isComeback = true;
    }
  }

  return { badges, isComeback };
}

/**
 * Get last session's sets for an exercise by name, excluding a specific workout.
 * Used by ExerciseCard for nudge computation and volume comparison.
 */
export async function getLastSessionSetsForExercise(
  exerciseName: string,
  excludeWorkoutId: string,
): Promise<{
  sets: { setNumber: number; weight: number; reps: number }[];
  previousVolume: number;
  lastDate: Date | null;
}> {
  const allExerciseRecords = await db.workoutExercises
    .where('exerciseName')
    .equals(exerciseName)
    .filter(e => !e.deleted)
    .toArray();

  const workoutIds = [...new Set(allExerciseRecords.map(e => e.workoutId))];
  const workouts = await Promise.all(workoutIds.map(id => db.workouts.get(id)));
  const completedWorkouts = workouts
    .filter((w): w is NonNullable<typeof w> => w != null && w.completedAt != null && w.id !== excludeWorkoutId && !w.deleted)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());

  if (completedWorkouts.length === 0) {
    return { sets: [], previousVolume: 0, lastDate: null };
  }

  const lastWorkout = completedWorkouts[0];
  const lastExerciseRecords = allExerciseRecords.filter(e => e.workoutId === lastWorkout.id);
  if (lastExerciseRecords.length === 0) {
    return { sets: [], previousVolume: 0, lastDate: lastWorkout.completedAt ?? null };
  }

  const lastExIds = lastExerciseRecords.map(e => e.id);
  const lastSets = await db.workoutSets
    .where('workoutExerciseId')
    .anyOf(lastExIds)
    .filter(s => !s.deleted)
    .toArray();

  const sets = lastSets
    .map(s => ({
      setNumber: s.setNumber,
      weight: s.weight,
      reps: s.reps,
    }))
    .sort((a, b) => a.setNumber - b.setNumber);

  const previousVolume = lastSets.reduce((sum, s) => sum + setVolume(s.weight, s.reps, settingsService.getBodyWeight()), 0);

  return { sets, previousVolume, lastDate: lastWorkout.completedAt ?? null };
}

/**
 * Generate a post-workout summary comparing current workout to last same-name workout.
 * Called BEFORE finishWorkout (current workout has no completedAt).
 */
export async function generateWorkoutSummary(
  workoutId: string,
): Promise<WorkoutSummary> {
  const workout = await db.workouts.get(workoutId);
  if (!workout) {
    return {
      totalVolume: 0,
      previousTotalVolume: null,
      volumeChangePercent: null,
      exercises: [],
      winCount: 0,
      totalExercises: 0,
      bestAchievement: null,
      durationMinutes: null,
      intensity: null,
      previousIntensity: null,
      intensityChangePercent: null,
    };
  }

  // Get all exercises for current workout
  const currentExercises = await db.workoutExercises
    .where('workoutId')
    .equals(workoutId)
    .filter(e => !e.deleted)
    .sortBy('order');

  // Find previous completed workout with same name (D-21)
  const allWorkouts = await db.workouts.filter(w => !w.deleted).toArray();
  const previousSameNameWorkouts = allWorkouts
    .filter(w => w.completedAt != null && w.name === workout.name && w.id !== workoutId)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());

  const previousWorkout = previousSameNameWorkouts.length > 0 ? previousSameNameWorkouts[0] : null;

  // Compute current total volume
  let totalVolume = 0;
  const exerciseComparisons: ExerciseComparison[] = [];
  let prDescriptions: string[] = [];

  for (const ex of currentExercises) {
    const currentSets = await db.workoutSets
      .where('workoutExerciseId')
      .equals(ex.id)
      .filter(s => !s.deleted)
      .toArray();
    const currentVolume = currentSets.reduce((sum, s) => sum + setVolume(s.weight, s.reps, settingsService.getBodyWeight()), 0);
    totalVolume += currentVolume;

    // Find previous session for this specific exercise
    const allExRecords = await db.workoutExercises
      .where('exerciseName')
      .equals(ex.exerciseName)
      .filter(e => !e.deleted)
      .toArray();

    // Filter to completed workouts, exclude current and deleted
    const exWorkoutIds = [...new Set(allExRecords.map(e => e.workoutId))];
    const exWorkouts = await Promise.all(exWorkoutIds.map(id => db.workouts.get(id)));
    const completedExWorkouts = exWorkouts
      .filter((w): w is NonNullable<typeof w> => w != null && w.completedAt != null && w.id !== workoutId && !w.deleted)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());

    let previousVolume: number | null = null;
    let direction: 'up' | 'down' | 'same' | 'new' = 'new';

    if (completedExWorkouts.length > 0) {
      const lastExWorkout = completedExWorkouts[0];
      const lastExRecords = allExRecords.filter(e => e.workoutId === lastExWorkout.id);
      if (lastExRecords.length > 0) {
        const lastExIds = lastExRecords.map(e => e.id);
        const prevSets = await db.workoutSets
          .where('workoutExerciseId')
          .anyOf(lastExIds)
          .filter(s => !s.deleted)
          .toArray();
        previousVolume = prevSets.reduce((sum, s) => sum + setVolume(s.weight, s.reps, settingsService.getBodyWeight()), 0);

        if (currentVolume > previousVolume) direction = 'up';
        else if (currentVolume < previousVolume) direction = 'down';
        else direction = 'same';
      }
    }

    // Get badges for this exercise
    const badgeResult = await getSetBadgesForExercise(ex.id, workoutId);

    // Track PRs for bestAchievement
    for (const [setId, badge] of badgeResult.badges) {
      if (badge === 'PR') {
        const set = currentSets.find(s => s.id === setId);
        if (set) {
          prDescriptions.push(`PR: ${ex.exerciseName} ${set.weight} x ${set.reps}`);
        }
      }
    }

    exerciseComparisons.push({
      exerciseName: ex.exerciseName,
      currentVolume,
      previousVolume,
      direction,
      setBadges: badgeResult.badges,
      isComeback: badgeResult.isComeback,
    });
  }

  // Compute previous total volume (from previous same-name workout)
  let previousTotalVolume: number | null = null;
  let volumeChangePercent: number | null = null;

  if (previousWorkout) {
    const prevExercises = await db.workoutExercises
      .where('workoutId')
      .equals(previousWorkout.id)
      .filter(e => !e.deleted)
      .toArray();
    const prevExIds = prevExercises.map(e => e.id);
    let prevTotal = 0;
    if (prevExIds.length > 0) {
      const prevSets = await db.workoutSets
        .where('workoutExerciseId')
        .anyOf(prevExIds)
        .filter(s => !s.deleted)
        .toArray();
      prevTotal = prevSets.reduce((sum, s) => sum + setVolume(s.weight, s.reps, settingsService.getBodyWeight()), 0);
    }
    previousTotalVolume = prevTotal;
    if (prevTotal > 0) {
      volumeChangePercent = ((totalVolume - prevTotal) / prevTotal) * 100;
    }
  }

  const winCount = exerciseComparisons.filter(e => e.direction === 'up').length;

  // Compute current workout duration & intensity
  let durationMinutes: number | null = null;
  {
    const allCurrentExIds = currentExercises.map(e => e.id);
    if (allCurrentExIds.length > 0) {
      const allCurrentSets = await db.workoutSets
        .where('workoutExerciseId').anyOf(allCurrentExIds)
        .filter(s => !s.deleted).toArray();
      if (allCurrentSets.length >= 2) {
        const earliest = allCurrentSets.reduce((min, s) =>
          s.timestamp.getTime() < min ? s.timestamp.getTime() : min, Infinity);
        const latest = allCurrentSets.reduce((max, s) =>
          s.timestamp.getTime() > max ? s.timestamp.getTime() : max, 0);
        durationMinutes = Math.max(1, Math.round((latest - earliest) / 60000));
      } else if (allCurrentSets.length === 1) {
        durationMinutes = 1;
      }
    }
  }
  const intensity = (durationMinutes && totalVolume > 0)
    ? Math.round(totalVolume / durationMinutes)
    : null;

  // Compute previous workout intensity
  let previousIntensity: number | null = null;
  let intensityChangePercent: number | null = null;
  if (previousWorkout && previousTotalVolume && previousTotalVolume > 0) {
    const prevExs = await db.workoutExercises
      .where('workoutId').equals(previousWorkout.id)
      .filter(e => !e.deleted).toArray();
    const prevExIds = prevExs.map(e => e.id);
    if (prevExIds.length > 0) {
      const prevSets = await db.workoutSets
        .where('workoutExerciseId').anyOf(prevExIds)
        .filter(s => !s.deleted).toArray();
      if (prevSets.length >= 2) {
        const earliest = prevSets.reduce((min, s) =>
          s.timestamp.getTime() < min ? s.timestamp.getTime() : min, Infinity);
        const latest = prevSets.reduce((max, s) =>
          s.timestamp.getTime() > max ? s.timestamp.getTime() : max, 0);
        const prevDuration = Math.max(1, Math.round((latest - earliest) / 60000));
        previousIntensity = Math.round(previousTotalVolume / prevDuration);
        if (intensity !== null && previousIntensity > 0) {
          intensityChangePercent = ((intensity - previousIntensity) / previousIntensity) * 100;
        }
      }
    }
  }

  // Best achievement: prefer PRs, fallback to intensity gain, then volume gain
  let bestAchievement: string | null = null;
  if (prDescriptions.length > 0) {
    bestAchievement = prDescriptions[0];
  } else if (previousWorkout && volumeChangePercent != null && volumeChangePercent > 0) {
    bestAchievement = `Total volume up ${volumeChangePercent.toFixed(1)}%`;
  } else if (intensityChangePercent != null && intensityChangePercent > 5) {
    bestAchievement = `Intensity up ${intensityChangePercent.toFixed(1)}%`;
  } else if (!previousWorkout) {
    bestAchievement = 'First workout completed!';
  }

  return {
    totalVolume,
    previousTotalVolume,
    volumeChangePercent,
    exercises: exerciseComparisons,
    winCount,
    totalExercises: currentExercises.length,
    bestAchievement,
    durationMinutes,
    intensity,
    previousIntensity,
    intensityChangePercent,
  };
}
