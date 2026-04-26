import { db } from '../db/database';
import { setVolume } from '../utils/formatters';
import { settingsService } from './settingsService';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportJSON(): Promise<void> {
  const workouts = await db.workouts.filter(w => !w.deleted).toArray();
  const exercises = await db.workoutExercises.filter(e => !e.deleted).toArray();
  const sets = await db.workoutSets.filter(s => !s.deleted).toArray();
  const templates = await db.workoutTemplates.filter(t => !t.deleted).toArray();

  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    workouts,
    exercises,
    sets,
    templates,
  };

  downloadFile(
    JSON.stringify(data, null, 2),
    `moar-backup-${new Date().toISOString().slice(0, 10)}.json`,
    'application/json'
  );
}

export async function exportCSV(): Promise<void> {
  const workouts = await db.workouts.filter(w => !w.deleted).toArray();
  const bw = settingsService.getBodyWeight();

  const rows: string[][] = [
    ['Date', 'Workout', 'Exercise', 'Set', 'Weight (lbs)', 'Reps', 'Volume (lbs)', 'Timestamp'],
  ];

  for (const w of workouts) {
    if (!w.completedAt) continue;
    const dateStr = w.completedAt.toISOString().slice(0, 10);

    const exercises = await db.workoutExercises
      .where('workoutId').equals(w.id!)
      .filter(e => !e.deleted)
      .sortBy('order');

    for (const ex of exercises) {
      const sets = await db.workoutSets
        .where('workoutExerciseId').equals(ex.id!)
        .filter(s => !s.deleted)
        .sortBy('setNumber');

      for (const s of sets) {
        const vol = setVolume(s.weight, s.reps, bw);
        rows.push([
          dateStr,
          w.name,
          ex.exerciseName,
          s.setNumber.toString(),
          s.weight.toString(),
          s.reps.toString(),
          vol.toString(),
          s.timestamp.toISOString(),
        ]);
      }
    }
  }

  const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  downloadFile(
    csv,
    `moar-data-${new Date().toISOString().slice(0, 10)}.csv`,
    'text/csv'
  );
}
