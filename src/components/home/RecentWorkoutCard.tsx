import type { RecentWorkout } from '../../services/workoutService';
import { formatRelativeDate, formatVolume } from '../../utils/formatters';

interface RecentWorkoutCardProps {
  workout: RecentWorkout;
  onRepeat: (templateName: string) => void;
}

export default function RecentWorkoutCard({ workout, onRepeat }: RecentWorkoutCardProps) {
  return (
    <div className="bg-bg-card rounded-xl p-4 flex items-center min-h-[44px]">
      <div className="flex-1 min-w-0">
        <div className="text-text-primary font-semibold truncate">{workout.name}</div>
        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-text-secondary text-sm">
          <span>{formatRelativeDate(workout.completedAt)}</span>
          <span>&middot;</span>
          <span>{formatVolume(workout.totalVolume)}</span>
          {workout.intensity !== null && (
            <>
              <span>&middot;</span>
              <span>
                <span className="text-text-primary tabular-nums font-medium">{workout.intensity}</span>
                <span className="text-xs ml-0.5">lbs/min</span>
              </span>
            </>
          )}
        </div>
      </div>
      <button
        onClick={() => onRepeat(workout.name)}
        className="text-accent font-semibold min-h-[44px] px-3 active:opacity-80 transition-opacity"
      >
        Repeat
      </button>
    </div>
  );
}
