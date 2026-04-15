import { useParams, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { workoutService } from '../services/workoutService';
import { formatAbsoluteDate, formatDuration, formatVolume } from '../utils/formatters';

export default function WorkoutDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const detail = useLiveQuery(
    () => id ? workoutService.getWorkoutDetail(id) : Promise.resolve(null),
    [id]
  );

  if (detail === undefined) return null;

  if (detail === null) {
    return (
      <div className="pt-6 flex flex-col gap-4">
        <button
          onClick={() => navigate('/history')}
          className="text-accent font-semibold self-start min-h-[44px] active:opacity-80 transition-opacity"
        >
          &larr; Back to History
        </button>
        <p className="text-text-secondary">Workout not found.</p>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-4 flex flex-col gap-4">
      <button
        onClick={() => navigate(-1)}
        className="text-accent font-semibold self-start min-h-[44px] active:opacity-80 transition-opacity"
      >
        &larr; Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-text-primary">{detail.name}</h1>
        <div className="flex items-center gap-2 text-text-secondary text-sm mt-1">
          <span>{formatAbsoluteDate(detail.completedAt)}</span>
          <span>&middot;</span>
          <span>{formatDuration(detail.duration)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {detail.exercises.map((exercise, idx) => (
          <div key={idx} className="bg-bg-card rounded-xl p-4">
            <span
              onClick={() => navigate(`/exercise/${encodeURIComponent(exercise.exerciseName)}`)}
              className="font-semibold text-accent cursor-pointer active:opacity-80 transition-opacity"
            >
              {exercise.exerciseName}
            </span>

            <table className="w-full mt-2 text-sm">
              <thead>
                <tr className="text-text-secondary text-left">
                  <th className="font-normal py-1">Set</th>
                  <th className="font-normal py-1">Weight</th>
                  <th className="font-normal py-1">Reps</th>
                </tr>
              </thead>
              <tbody>
                {exercise.sets.map(set => (
                  <tr key={set.setNumber} className="text-text-primary">
                    <td className="py-1">{set.setNumber}</td>
                    <td className="py-1">{set.weight} lbs</td>
                    <td className="py-1">{set.reps}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-text-secondary text-sm mt-2">
              Volume: {formatVolume(exercise.volume)}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-bg-card rounded-xl p-4 text-center">
        <div className="text-text-secondary text-sm">Total Volume</div>
        <div className="text-text-primary text-xl font-bold mt-1">
          {formatVolume(detail.totalVolume)}
        </div>
      </div>
    </div>
  );
}
