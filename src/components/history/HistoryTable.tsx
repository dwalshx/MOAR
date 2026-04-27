import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import type { WorkoutExercise, WorkoutSet } from '../../db/models';
import { setVolume, formatAbsoluteDate } from '../../utils/formatters';
import { settingsService } from '../../services/settingsService';
import { workoutService } from '../../services/workoutService';

interface FlatRow {
  date: string;
  workoutName: string;
  workoutIntensity: number | null;
  exercise: string;
  setNum: number;
  weight: number;
  reps: number;
  volume: number;
}

export default function HistoryTable() {
  const rows = useLiveQuery(async () => {
    const workouts = await db.workouts.filter(w => !w.deleted && !!w.completedAt).toArray();
    workouts.sort((a, b) => (b.completedAt!.getTime()) - (a.completedAt!.getTime()));

    const bw = settingsService.getBodyWeight();
    const flat: FlatRow[] = [];

    for (const w of workouts) {
      const exercises = await db.workoutExercises
        .where('workoutId').equals(w.id!)
        .filter(e => !e.deleted)
        .sortBy('order');

      // Compute workout-level intensity once per workout
      let workoutVolume = 0;
      const exerciseSets: { ex: WorkoutExercise; sets: WorkoutSet[] }[] = [];
      for (const ex of exercises) {
        const sets = await db.workoutSets
          .where('workoutExerciseId').equals(ex.id!)
          .filter(s => !s.deleted)
          .sortBy('setNumber');
        exerciseSets.push({ ex, sets });
        for (const s of sets) workoutVolume += setVolume(s.weight, s.reps, bw);
      }
      const duration = await workoutService.getWorkoutDuration(w.id);
      const workoutIntensity = duration && workoutVolume > 0
        ? Math.round(workoutVolume / duration)
        : null;

      for (const { ex, sets } of exerciseSets) {
        for (const s of sets) {
          flat.push({
            date: formatAbsoluteDate(w.completedAt!),
            workoutName: w.name,
            workoutIntensity,
            exercise: ex.exerciseName,
            setNum: s.setNumber,
            weight: s.weight,
            reps: s.reps,
            volume: setVolume(s.weight, s.reps, bw),
          });
        }
      }
    }

    return flat;
  });

  if (rows === undefined) return null;

  if (rows.length === 0) {
    return (
      <p className="text-text-secondary text-sm text-center py-4">
        No workout data yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4">
      <table className="w-full text-sm min-w-[680px]">
        <thead>
          <tr className="border-b border-border text-text-secondary text-left">
            <th className="py-2 px-3 font-medium">Date</th>
            <th className="py-2 px-3 font-medium">Workout</th>
            <th className="py-2 px-3 font-medium text-right">lbs/min</th>
            <th className="py-2 px-3 font-medium">Exercise</th>
            <th className="py-2 px-3 font-medium text-right">Set</th>
            <th className="py-2 px-3 font-medium text-right">Weight</th>
            <th className="py-2 px-3 font-medium text-right">Reps</th>
            <th className="py-2 px-3 font-medium text-right">Volume</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const prev = i > 0 ? rows[i - 1] : null;
            const showDate = !prev || prev.date !== row.date || prev.workoutName !== row.workoutName;
            const showExercise = !prev || prev.exercise !== row.exercise || showDate;

            return (
              <tr
                key={i}
                className="border-b border-border/30 hover:bg-bg-card/50 transition-colors"
              >
                <td className="py-1.5 px-3 text-text-secondary text-xs">
                  {showDate ? row.date : ''}
                </td>
                <td className="py-1.5 px-3 text-text-primary text-xs">
                  {showDate ? row.workoutName : ''}
                </td>
                <td className="py-1.5 px-3 text-text-secondary text-xs text-right tabular-nums">
                  {showDate && row.workoutIntensity !== null ? row.workoutIntensity : ''}
                </td>
                <td className="py-1.5 px-3 text-accent text-xs">
                  {showExercise ? row.exercise : ''}
                </td>
                <td className="py-1.5 px-3 text-text-secondary text-xs text-right">
                  {row.setNum}
                </td>
                <td className="py-1.5 px-3 text-text-primary text-xs text-right">
                  {row.weight}
                </td>
                <td className="py-1.5 px-3 text-text-primary text-xs text-right">
                  {row.reps}
                </td>
                <td className="py-1.5 px-3 text-text-primary text-xs text-right font-medium">
                  {row.volume.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
