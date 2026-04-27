import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import CalendarHeatmap from './CalendarHeatmap';

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Monthly calendar heatmap of workout days. Days where you completed a
 * workout are highlighted; multiple workouts in a day get more intense.
 */
export default function WorkoutHeatmap() {
  const completedWorkouts = useLiveQuery(async () => {
    const all = await db.workouts.filter(w => !w.deleted && !!w.completedAt).toArray();
    return all
      .map(w => w.completedAt)
      .filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()));
  });

  if (completedWorkouts === undefined) return null;

  const days = new Map<string, number>();
  for (const d of completedWorkouts) {
    const k = dayKey(d);
    days.set(k, Math.min(3, (days.get(k) ?? 0) + 1));
  }

  const total = completedWorkouts.length;
  const totalLabel = `${total} ${total === 1 ? 'workout' : 'workouts'}`;

  return (
    <CalendarHeatmap
      daysWithActivity={days}
      totalLabel={totalLabel}
      title="Activity"
    />
  );
}
