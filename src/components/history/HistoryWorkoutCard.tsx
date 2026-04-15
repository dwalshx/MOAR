import type { RecentWorkout } from '../../services/workoutService';
import { formatRelativeDate, formatVolume } from '../../utils/formatters';

interface HistoryWorkoutCardProps {
  workout: RecentWorkout;
  onTap: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function HistoryWorkoutCard({ workout, onTap, onDelete }: HistoryWorkoutCardProps) {
  return (
    <div
      onClick={() => onTap(workout.id)}
      className="bg-bg-card rounded-xl p-4 flex items-center min-h-[44px] cursor-pointer active:opacity-80 transition-opacity"
    >
      <div className="flex-1 min-w-0">
        <div className="text-text-primary font-semibold truncate">{workout.name}</div>
        <div className="flex items-center gap-1 text-text-secondary text-sm">
          <span>{formatRelativeDate(workout.completedAt)}</span>
          <span>&middot;</span>
          <span>{formatVolume(workout.totalVolume)}</span>
        </div>
      </div>
      {onDelete && (
        <button
          type="button"
          className="min-w-[36px] min-h-[44px] flex items-center justify-center
                     text-red-500/40 hover:text-red-500 active:text-red-400 transition-colors ml-2"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete "${workout.name}" and all its data?`)) {
              onDelete(workout.id);
            }
          }}
          aria-label="Delete workout"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
