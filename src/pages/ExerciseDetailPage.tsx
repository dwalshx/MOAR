import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { workoutService } from '../services/workoutService';
import { formatChartDate, formatAbsoluteDate } from '../utils/formatters';
import ExerciseVolumeChart from '../components/exercise/ExerciseVolumeChart';
import SessionRow from '../components/exercise/SessionRow';
import CalendarHeatmap from '../components/home/CalendarHeatmap';
import type { VolumeDataPoint } from '../services/workoutService';

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ExerciseDetailPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const exerciseName = decodeURIComponent(name || '');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const sessions = useLiveQuery(
    () => workoutService.getExerciseHistory(exerciseName, 20),
    [exerciseName]
  );

  if (sessions === undefined) {
    return (
      <div className="pt-6 px-4 animate-pulse">
        <div className="h-8 bg-bg-secondary rounded w-1/2 mb-4" />
        <div className="h-[200px] bg-bg-secondary rounded" />
      </div>
    );
  }

  // Transform sessions to chart data points (reverse for chronological order).
  // Per-exercise intensity isn't currently tracked separately, so we set it null.
  const chartData: VolumeDataPoint[] = [...sessions]
    .reverse()
    .map((s) => ({
      date: formatChartDate(s.date),
      volume: s.totalVolume,
      intensity: null,
      fullDate: formatAbsoluteDate(s.date),
    }));

  const handleToggleSession = (workoutId: string) => {
    setExpandedSessionId((prev) => (prev === workoutId ? null : workoutId));
  };

  return (
    <div className="pt-6 px-4 pb-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-text-secondary mb-4 active:opacity-80"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm">Back</span>
      </button>

      {/* Page title */}
      <h1 className="text-2xl font-bold text-text-primary mb-4">{exerciseName}</h1>

      {sessions.length === 0 ? (
        <p className="text-text-secondary text-sm">No history for this exercise yet.</p>
      ) : (
        <>
          {/* Calendar heatmap of days you did this exercise */}
          {(() => {
            const days = new Map<string, number>();
            for (const s of sessions) {
              days.set(dayKey(s.date), 3);
            }
            const total = sessions.length;
            return (
              <CalendarHeatmap
                daysWithActivity={days}
                totalLabel={`${total} ${total === 1 ? 'session' : 'sessions'}`}
                title="When you did this"
              />
            );
          })()}

          {/* Volume chart */}
          <div className="mb-6 mt-6">
            <ExerciseVolumeChart data={chartData} />
          </div>

          {/* Session list */}
          <h2 className="text-lg font-semibold text-text-primary mb-3">Sessions</h2>
          <div className="flex flex-col gap-2">
            {sessions.map((session) => (
              <SessionRow
                key={session.workoutId}
                session={session}
                isExpanded={expandedSessionId === session.workoutId}
                onToggle={() => handleToggleSession(session.workoutId)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
