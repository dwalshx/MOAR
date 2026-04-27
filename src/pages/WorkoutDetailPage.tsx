import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { workoutService } from '../services/workoutService';
import { settingsService } from '../services/settingsService';
import { formatAbsoluteDate, formatDuration, formatVolume } from '../utils/formatters';
import BarTypeSelector from '../components/workout/BarTypeSelector';
import Stepper from '../components/workout/Stepper';

type ExerciseDetail = NonNullable<Awaited<ReturnType<typeof workoutService.getWorkoutDetail>>>['exercises'][number];
type SetDetail = ExerciseDetail['sets'][number];

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
        {detail.exercises.map(exercise => (
          <ExerciseDetailCard key={exercise.id} exercise={exercise} />
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

function ExerciseDetailCard({ exercise }: { exercise: ExerciseDetail }) {
  const navigate = useNavigate();
  const isBodyweight = exercise.barType === 'bodyweight';
  const bw = settingsService.getBodyWeight();

  return (
    <div className="bg-bg-card rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <span
          onClick={() => navigate(`/exercise/${encodeURIComponent(exercise.exerciseName)}`)}
          className="font-semibold text-accent cursor-pointer active:opacity-80 transition-opacity"
        >
          {exercise.exerciseName}
        </span>
        <BarTypeSelector
          value={exercise.barType}
          onChange={(barType) => workoutService.updateExerciseBarType(exercise.id, barType)}
        />
      </div>

      <table className="w-full mt-3 text-sm">
        <thead>
          <tr className="text-text-secondary text-left text-xs uppercase tracking-wide">
            <th className="font-normal py-1 pr-3">Set</th>
            <th className="font-normal py-1 pr-3">Weight</th>
            <th className="font-normal py-1 pr-3">Reps</th>
            <th className="font-normal py-1 text-right">&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {exercise.sets.map(set => (
            <EditableSetRow
              key={set.id}
              set={set}
              isBodyweight={isBodyweight}
              bodyWeight={bw}
            />
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
  );
}

function EditableSetRow({
  set,
  isBodyweight,
  bodyWeight,
}: {
  set: SetDetail;
  isBodyweight: boolean;
  bodyWeight: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draftWeight, setDraftWeight] = useState(set.weight);
  const [draftReps, setDraftReps] = useState(set.reps);

  const startEdit = () => {
    setDraftWeight(set.weight);
    setDraftReps(set.reps);
    setEditing(true);
  };

  const save = async () => {
    await workoutService.updateSet(set.id, draftWeight, draftReps);
    setEditing(false);
  };

  const remove = async () => {
    if (confirm(`Delete set ${set.setNumber}?`)) {
      await workoutService.deleteSet(set.id);
    }
  };

  // Display logic for bodyweight-style display
  const weightDisplay = (() => {
    if (set.weight > 0) return `${set.weight} lbs`;
    if (isBodyweight) {
      return bodyWeight ? `BW (${bodyWeight})` : 'BW';
    }
    return bodyWeight ? `BW (${bodyWeight})` : '0 lbs';
  })();

  if (editing) {
    return (
      <tr className="text-text-primary border-t border-border/30">
        <td colSpan={4} className="py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-xs font-semibold">
              Edit set {set.setNumber}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="text-text-secondary text-xs px-2 py-1 active:opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="bg-accent text-white text-xs font-semibold px-3 py-1 rounded active:opacity-80"
              >
                Save
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-center">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-text-secondary text-[10px] uppercase">Weight</span>
              <Stepper
                value={draftWeight}
                increments={[10, 1, 0.5]}
                onChange={setDraftWeight}
                min={0}
                label="lbs"
              />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-text-secondary text-[10px] uppercase">Reps</span>
              <Stepper
                value={draftReps}
                increments={[5, 1]}
                onChange={setDraftReps}
                min={1}
                label="reps"
              />
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr
      onClick={startEdit}
      className="text-text-primary cursor-pointer active:bg-bg-secondary transition-colors"
    >
      <td className="py-1.5 pr-3">{set.setNumber}</td>
      <td className="py-1.5 pr-3 tabular-nums">{weightDisplay}</td>
      <td className="py-1.5 pr-3 tabular-nums">{set.reps}</td>
      <td className="py-1.5 text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();
            remove();
          }}
          className="text-red-500/40 active:text-red-500 px-2 transition-colors"
          aria-label="Delete set"
        >
          ×
        </button>
      </td>
    </tr>
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
