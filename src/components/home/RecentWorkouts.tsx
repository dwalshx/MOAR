import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { workoutService } from '../../services/workoutService';
import RecentWorkoutCard from './RecentWorkoutCard';

export default function RecentWorkouts() {
  const navigate = useNavigate();

  const recentWorkouts = useLiveQuery(
    () => workoutService.getRecentWorkouts(10)
  );

  const handleRepeat = async (templateName: string) => {
    const workoutId = await workoutService.startWorkoutFromTemplate(templateName);
    navigate(`/workout/${workoutId}`);
  };

  // While loading (undefined), render nothing to avoid flash
  if (recentWorkouts === undefined) return null;

  // Empty state
  if (recentWorkouts.length === 0) {
    return (
      <div className="mt-6">
        <h2 className="text-text-secondary text-sm font-semibold uppercase tracking-wide mb-3">
          Recent Workouts
        </h2>
        <p className="text-text-secondary text-center text-sm py-4">
          Complete a workout to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-text-secondary text-sm font-semibold uppercase tracking-wide mb-3">
        Recent Workouts
      </h2>
      <div className="flex flex-col gap-2">
        {recentWorkouts.map((workout) => (
          <RecentWorkoutCard
            key={workout.id}
            workout={workout}
            onRepeat={handleRepeat}
          />
        ))}
      </div>
    </div>
  );
}
