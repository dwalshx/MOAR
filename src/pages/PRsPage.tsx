import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { getAllPRs } from '../services/comparisonService';
import { formatRelativeDate } from '../utils/formatters';

export default function PRsPage() {
  const navigate = useNavigate();
  const prs = useLiveQuery(() => getAllPRs());

  if (prs === undefined) return null;

  return (
    <div className="pt-6 pb-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏆</span>
        <h1 className="text-2xl font-bold text-text-primary">Personal Records</h1>
      </div>

      {prs.length === 0 ? (
        <p className="text-text-secondary text-sm py-4">
          Complete a workout to start setting PRs.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {prs.map((pr) => (
            <button
              key={pr.exerciseName}
              onClick={() =>
                navigate(`/exercise/${encodeURIComponent(pr.exerciseName)}`)
              }
              className="bg-bg-card rounded-xl p-4 flex items-center justify-between
                         min-h-[44px] active:opacity-80 transition-opacity text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="text-text-primary font-semibold truncate">
                  {pr.exerciseName}
                </div>
                <div className="text-text-secondary text-xs mt-0.5">
                  {formatRelativeDate(pr.date)}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <div className="text-yellow-400 font-black text-lg tabular-nums">
                  {pr.weight} <span className="text-text-secondary text-sm font-medium">×</span> {pr.reps}
                </div>
                <div className="text-text-secondary text-xs tabular-nums">
                  {pr.volume.toLocaleString()} lbs
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
