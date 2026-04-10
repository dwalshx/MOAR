import type { ExerciseSession } from '../../services/workoutService';
import { formatRelativeDate, formatVolume } from '../../utils/formatters';

interface SessionRowProps {
  session: ExerciseSession;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function SessionRow({ session, isExpanded, onToggle }: SessionRowProps) {
  return (
    <div className="bg-bg-card rounded-xl overflow-hidden">
      {/* Summary row - always visible */}
      <div
        className="flex items-center justify-between p-3 min-h-[44px] cursor-pointer active:bg-bg-secondary transition-colors"
        onClick={onToggle}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-3">
          <span className="text-text-primary text-sm font-medium">
            {formatRelativeDate(session.date)}
          </span>
          <span className="text-text-secondary text-sm">
            {session.setCount} {session.setCount === 1 ? 'set' : 'sets'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-sm">
            {formatVolume(session.totalVolume)}
          </span>
          <svg
            className={`w-4 h-4 text-text-secondary transition-transform duration-150 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded sets detail */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-border">
          <table className="w-full text-sm text-text-secondary mt-2">
            <thead>
              <tr className="text-left">
                <th className="font-medium pb-1">Set</th>
                <th className="font-medium pb-1">Weight</th>
                <th className="font-medium pb-1">Reps</th>
              </tr>
            </thead>
            <tbody>
              {session.sets.map((s) => (
                <tr key={s.setNumber}>
                  <td className="py-0.5">{s.setNumber}</td>
                  <td className="py-0.5">{s.weight} lbs</td>
                  <td className="py-0.5">{s.reps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
