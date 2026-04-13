import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { setVolume, formatAbsoluteDate } from '../../utils/formatters';
import { settingsService } from '../../services/settingsService';

interface FlatRow {
  date: string;
  workoutName: string;
  exercise: string;
  setNum: number;
  weight: number;
  reps: number;
  volume: number;
}

export default function HistoryTable() {
  const rows = useLiveQuery(async () => {
    const workouts = await db.workouts.filter(w => !!w.completedAt).toArray();
    // Sort newest first
    workouts.sort((a, b) => (b.completedAt!.getTime()) - (a.completedAt!.getTime()));

    const bw = settingsService.getBodyWeight();
    const flat: FlatRow[] = [];

    for (const w of workouts) {
      const exercises = await db.workoutExercises
        .where('workoutId').equals(w.id!)
        .sortBy('order');

      for (const ex of exercises) {
        const sets = await db.workoutSets
          .where('workoutExerciseId').equals(ex.id!)
          .sortBy('setNumber');

        for (const s of sets) {
          flat.push({
            date: formatAbsoluteDate(w.completedAt!),
            workoutName: w.name,
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
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="border-b border-border text-text-secondary text-left">
            <th className="py-2 px-3 font-medium">Date</th>
            <th className="py-2 px-3 font-medium">Workout</th>
            <th className="py-2 px-3 font-medium">Exercise</th>
            <th className="py-2 px-3 font-medium text-right">Set</th>
            <th className="py-2 px-3 font-medium text-right">Weight</th>
            <th className="py-2 px-3 font-medium text-right">Reps</th>
            <th className="py-2 px-3 font-medium text-right">Volume</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            // Show date and workout name only on first row of each group
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
