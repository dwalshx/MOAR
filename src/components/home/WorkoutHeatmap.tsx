import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';

const WEEKS = 13; // ~3 months
const DAYS_PER_WEEK = 7;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

interface DayCell {
  date: Date;
  workouts: number;
  isFuture: boolean;
}

/**
 * GitHub-style heatmap of workout days. Last 13 weeks, oldest in left column,
 * most recent on right. Days with workouts get progressively more intense
 * orange (1, 2, 3+ workouts in a day).
 */
export default function WorkoutHeatmap() {
  const completedWorkouts = useLiveQuery(async () => {
    const all = await db.workouts.filter(w => !w.deleted && !!w.completedAt).toArray();
    return all.map(w => w.completedAt!);
  });

  if (completedWorkouts === undefined) return null;

  // Build a map of day-time → count
  const byDay = new Map<number, number>();
  for (const d of completedWorkouts) {
    const key = startOfDay(d).getTime();
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }

  // Build grid: oldest week on left, today's week on right
  // Each column is a week (Sunday-Saturday), each cell is one day
  const today = startOfDay(new Date());
  const todayDow = today.getDay(); // 0=Sun, 6=Sat
  // Start of current week (Sunday)
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - todayDow);

  const columns: DayCell[][] = [];
  for (let weekOffset = WEEKS - 1; weekOffset >= 0; weekOffset--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - weekOffset * 7);

    const cells: DayCell[] = [];
    for (let dow = 0; dow < DAYS_PER_WEEK; dow++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + dow);
      const dayTime = startOfDay(day).getTime();
      cells.push({
        date: day,
        workouts: byDay.get(dayTime) ?? 0,
        isFuture: dayTime > today.getTime(),
      });
    }
    columns.push(cells);
  }

  const totalDays = completedWorkouts.length;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-text-secondary text-sm font-semibold uppercase tracking-wide">
          Activity
        </h2>
        <span className="text-text-secondary text-xs">
          {totalDays} {totalDays === 1 ? 'workout' : 'workouts'}
        </span>
      </div>
      <div className="bg-bg-card rounded-xl p-3">
        <div className="flex gap-[3px] justify-between">
          {columns.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px] flex-1 max-w-[14px]">
              {week.map((cell, di) => (
                <Cell key={di} cell={cell} />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-text-secondary">
          <span>less</span>
          <div className="w-2 h-2 rounded-sm bg-bg-secondary border border-border" />
          <div className="w-2 h-2 rounded-sm" style={{ background: 'rgba(249, 115, 22, 0.35)' }} />
          <div className="w-2 h-2 rounded-sm" style={{ background: 'rgba(249, 115, 22, 0.65)' }} />
          <div className="w-2 h-2 rounded-sm bg-accent" />
          <span>more</span>
        </div>
      </div>
    </div>
  );
}

function Cell({ cell }: { cell: DayCell }) {
  if (cell.isFuture) {
    return <div className="aspect-square rounded-sm opacity-30 bg-bg-secondary" />;
  }
  const intensity =
    cell.workouts === 0 ? 0
    : cell.workouts === 1 ? 1
    : cell.workouts === 2 ? 2
    : 3;

  const bg =
    intensity === 0 ? 'bg-bg-secondary border border-border'
    : intensity === 1 ? ''
    : intensity === 2 ? ''
    : 'bg-accent';

  const inlineBg =
    intensity === 1 ? { background: 'rgba(249, 115, 22, 0.35)' }
    : intensity === 2 ? { background: 'rgba(249, 115, 22, 0.65)' }
    : undefined;

  const dateStr = cell.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const title = cell.workouts === 0
    ? `${dateStr} — no workout`
    : `${dateStr} — ${cell.workouts} workout${cell.workouts > 1 ? 's' : ''}`;

  return (
    <div
      className={`aspect-square rounded-sm ${bg}`}
      style={inlineBg}
      title={title}
    />
  );
}
