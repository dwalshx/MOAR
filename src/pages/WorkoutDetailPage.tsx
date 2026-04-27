import { useState } from 'react';
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
          <DetailDateEditor workoutId={detail.id} date={detail.completedAt} />
          <span>&middot;</span>
          <span>{formatDuration(detail.duration)}</span>
        </div>
        {detail.notes && (
          <p className="text-text-primary text-sm bg-bg-card rounded-lg p-3 mt-3 italic">
            {detail.notes}
          </p>
        )}
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

            {exercise.notes && (
              <p className="text-text-primary text-xs bg-bg-secondary rounded-lg px-3 py-2 mt-2 italic">
                {exercise.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-bg-card rounded-xl p-4 text-center">
          <div className="text-text-secondary text-xs uppercase tracking-wide">Total Volume</div>
          <div className="text-text-primary text-xl font-bold mt-1 tabular-nums">
            {formatVolume(detail.totalVolume)}
          </div>
        </div>
        <div className="bg-bg-card rounded-xl p-4 text-center">
          <div className="text-text-secondary text-xs uppercase tracking-wide">Intensity</div>
          <div className="text-text-primary text-xl font-bold mt-1 tabular-nums">
            {detail.intensity !== null ? (
              <>
                {detail.intensity}
                <span className="text-text-secondary text-sm font-medium ml-1">lbs/min</span>
              </>
            ) : (
              <span className="text-text-secondary text-sm">—</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailDateEditor({ workoutId, date }: { workoutId: string; date: Date }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="active:text-accent transition-colors"
      >
        {formatAbsoluteDate(date)}
      </button>
    );
  }

  const isoDate = date.toISOString().slice(0, 10);
  return (
    <input
      type="date"
      defaultValue={isoDate}
      autoFocus
      onBlur={() => setEditing(false)}
      onChange={async (e) => {
        const v = e.target.value;
        if (v) {
          const [y, m, d] = v.split('-').map(Number);
          const newDate = new Date(y, m - 1, d);
          await workoutService.updateWorkoutDate(workoutId, newDate);
        }
        setEditing(false);
      }}
      className="bg-bg-card border border-accent rounded px-2 py-1 text-sm text-text-primary outline-none"
    />
  );
}
