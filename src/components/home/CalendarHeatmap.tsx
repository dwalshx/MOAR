import { useState } from 'react';

interface CalendarHeatmapProps {
  /** Map of "YYYY-MM-DD" → intensity (0=none, 1=light, 2=med, 3=heavy) */
  daysWithActivity: Map<string, number>;
  /** Total label, shown in header (e.g., "12 workouts") */
  totalLabel?: string;
  /** How many months to allow scrolling back (default 6) */
  monthsBack?: number;
  /** Heading text (e.g., "Activity") */
  title?: string;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function CalendarHeatmap({
  daysWithActivity,
  totalLabel,
  monthsBack = 6,
  title = 'Activity',
}: CalendarHeatmapProps) {
  // Track which month is being viewed (offset 0 = current)
  const [offset, setOffset] = useState(0);

  const today = startOfDay(new Date());
  const viewMonth = new Date(today.getFullYear(), today.getMonth() - offset, 1);
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Compute calendar grid: starts on the Sunday of the week containing day 1
  const firstOfMonth = new Date(viewMonth);
  const startSundayOffset = firstOfMonth.getDay();
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startSundayOffset);

  // Always show 6 weeks (42 cells) — covers any month layout
  const cells: { date: Date; inMonth: boolean; isFuture: boolean; intensity: number }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({
      date: d,
      inMonth: isSameMonth(d, viewMonth),
      isFuture: d.getTime() > today.getTime(),
      intensity: daysWithActivity.get(dayKey(d)) ?? 0,
    });
  }

  const canGoBack = offset < monthsBack;
  const canGoForward = offset > 0;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-text-secondary text-sm font-semibold uppercase tracking-wide">
          {title}
        </h2>
        {totalLabel && (
          <span className="text-text-secondary text-xs">{totalLabel}</span>
        )}
      </div>
      <div className="bg-bg-card rounded-xl p-3">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => canGoBack && setOffset(offset + 1)}
            disabled={!canGoBack}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center
                       text-text-secondary disabled:opacity-30 active:text-accent transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-text-primary text-sm font-semibold">{monthLabel}</span>
          <button
            onClick={() => canGoForward && setOffset(offset - 1)}
            disabled={!canGoForward}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center
                       text-text-secondary disabled:opacity-30 active:text-accent transition-colors"
            aria-label="Next month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map((d, i) => (
            <div
              key={i}
              className="text-center text-text-secondary text-[10px] font-semibold"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => (
            <Cell key={i} cell={cell} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Cell({
  cell,
}: {
  cell: { date: Date; inMonth: boolean; isFuture: boolean; intensity: number };
}) {
  const day = cell.date.getDate();
  const isToday = startOfDay(new Date()).getTime() === startOfDay(cell.date).getTime();

  // Color by intensity (0 = no activity)
  const bg =
    cell.intensity === 0 ? 'bg-bg-secondary border border-border'
    : '';
  const inlineBg =
    cell.intensity === 1 ? { background: 'rgba(249, 115, 22, 0.4)' }
    : cell.intensity === 2 ? { background: 'rgba(249, 115, 22, 0.7)' }
    : cell.intensity >= 3 ? { background: 'var(--color-accent)' }
    : undefined;

  const textColor =
    cell.intensity > 0 ? 'text-white'
    : cell.inMonth ? 'text-text-primary'
    : 'text-text-secondary opacity-30';

  const ring = isToday ? 'ring-1 ring-accent' : '';

  return (
    <div
      className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium ${bg} ${textColor} ${ring} ${
        cell.isFuture ? 'opacity-30' : ''
      }`}
      style={inlineBg}
      title={cell.date.toLocaleDateString()}
    >
      {day}
    </div>
  );
}
