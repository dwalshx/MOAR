import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { workoutService } from '../../services/workoutService';

export default function Routines() {
  const navigate = useNavigate();
  const routines = useLiveQuery(() => workoutService.getTemplates());

  if (routines === undefined) return null;

  const handleStart = async (templateId: string) => {
    const workoutId = await workoutService.startWorkoutFromTemplateId(templateId);
    if (workoutId) navigate(`/workout/${workoutId}`);
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-text-secondary text-sm font-semibold uppercase tracking-wide">
          Routines
        </h2>
        <button
          onClick={() => navigate('/routines')}
          className="text-accent text-xs font-medium active:opacity-80"
        >
          {routines.length === 0 ? 'Create' : 'Manage'}
        </button>
      </div>

      {routines.length === 0 ? (
        <button
          onClick={() => navigate('/routines')}
          className="w-full bg-bg-card/60 border border-dashed border-border rounded-xl py-4
                     text-text-secondary text-sm active:bg-bg-card transition-colors"
        >
          + Build a routine for next time
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          {routines.slice(0, 5).map(r => (
            <div
              key={r.id}
              className="bg-bg-card rounded-xl p-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="text-text-primary font-semibold truncate">{r.name}</div>
                <div className="text-text-secondary text-xs">
                  {r.exercises.length === 0
                    ? 'No exercises'
                    : r.exercises.length === 1
                      ? '1 exercise'
                      : `${r.exercises.length} exercises`}
                </div>
              </div>
              <button
                onClick={() => handleStart(r.id)}
                disabled={r.exercises.length === 0}
                className="bg-accent text-white text-xs font-semibold px-3 py-2 rounded-lg
                           min-h-[36px] disabled:opacity-40 active:opacity-80 transition-opacity ml-2"
              >
                Start
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
