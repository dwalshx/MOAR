import type { WorkoutSummary as WorkoutSummaryData } from '../../services/comparisonService';
import { formatVolume } from '../../utils/formatters';

interface WorkoutSummaryProps {
  summary: WorkoutSummaryData;
  onDone: () => void;
}

function directionIndicator(direction: 'up' | 'down' | 'same' | 'new') {
  switch (direction) {
    case 'up':
      return <span className="text-success font-bold">↑</span>;
    case 'down':
      return <span className="text-red-500 font-bold">↓</span>;
    case 'same':
      return <span className="text-text-secondary font-bold">—</span>;
    case 'new':
      return <span className="text-accent font-bold">New</span>;
  }
}

export default function WorkoutSummary({ summary, onDone }: WorkoutSummaryProps) {
  const isFirstWorkout = summary.previousTotalVolume === null;
  const allNew = summary.exercises.every(e => e.direction === 'new');

  return (
    <div className="flex flex-col min-h-dvh p-4 bg-bg-primary">
      {/* Top heading */}
      <div className="text-center pt-6 pb-4">
        <h1 className="text-2xl font-bold text-text-primary">Workout Complete</h1>
      </div>

      {/* Total volume section */}
      <div className="text-center py-4">
        <p className="text-3xl font-bold text-text-primary">
          {formatVolume(summary.totalVolume)}
        </p>
        {isFirstWorkout ? (
          <p className="text-accent text-lg mt-1">Great start!</p>
        ) : summary.volumeChangePercent !== null ? (
          <p
            className={`text-lg mt-1 font-semibold ${
              summary.volumeChangePercent > 0
                ? 'text-success'
                : summary.volumeChangePercent < 0
                  ? 'text-red-500'
                  : 'text-text-secondary'
            }`}
          >
            vs last: {summary.volumeChangePercent > 0 ? '+' : ''}
            {summary.volumeChangePercent.toFixed(1)}%
          </p>
        ) : null}

        {/* Intensity row */}
        {summary.intensity !== null && summary.durationMinutes !== null && (
          <div className="mt-3 flex items-center justify-center gap-4 text-sm">
            <span className="text-text-secondary">
              <span className="text-text-primary font-bold">{summary.intensity}</span> lbs/min
            </span>
            <span className="text-text-secondary">
              over <span className="text-text-primary font-bold">{summary.durationMinutes}</span> min
            </span>
            {summary.intensityChangePercent !== null && (
              <span
                className={`font-semibold ${
                  summary.intensityChangePercent > 0
                    ? 'text-success'
                    : summary.intensityChangePercent < 0
                      ? 'text-red-500'
                      : 'text-text-secondary'
                }`}
              >
                {summary.intensityChangePercent > 0 ? '+' : ''}
                {summary.intensityChangePercent.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Exercise list */}
      <div className="flex flex-col gap-2 py-4">
        {summary.exercises.map((ex, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 px-3 bg-bg-secondary rounded-lg"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {directionIndicator(ex.direction)}
              <span className="text-text-primary truncate">{ex.exerciseName}</span>
            </div>
            <span className="text-text-secondary text-sm whitespace-nowrap ml-2">
              {formatVolume(ex.currentVolume)}
            </span>
          </div>
        ))}
      </div>

      {/* Win count — skip if first workout (all new) */}
      {!allNew && (
        <div className="text-center py-3">
          <p className="text-accent text-lg font-semibold">
            {summary.winCount} of {summary.totalExercises} exercises improved
          </p>
        </div>
      )}

      {/* Best achievement */}
      {summary.bestAchievement && (
        <div className="text-center py-3">
          <p className="text-success text-lg font-semibold">
            {summary.bestAchievement}
          </p>
        </div>
      )}

      {/* Spacer to push Done button to bottom */}
      <div className="flex-1" />

      {/* Done button */}
      <button
        type="button"
        className="w-full bg-accent text-white rounded-lg font-semibold
                   min-h-[44px] py-3 active:opacity-80 transition-opacity mb-4"
        onClick={onDone}
      >
        Done
      </button>
    </div>
  );
}
