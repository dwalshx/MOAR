import type { RecentWorkout } from '../../services/workoutService';
import { formatRelativeDate, formatVolume } from '../../utils/formatters';

interface HistoryWorkoutCardProps {
  workout: RecentWorkout;
  onTap: (id: number) => void;
}

export default function HistoryWorkoutCard({ workout, onTap }: HistoryWorkoutCardProps) {
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
    </div>
  );
}
