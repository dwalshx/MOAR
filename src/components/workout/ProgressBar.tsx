interface ProgressBarProps {
  current: number;
  target: number;
  prTarget?: number | null;
  label?: string;
  showPercent?: boolean;
}

export default function ProgressBar({
  current,
  target,
  prTarget,
  label,
  showPercent = true,
}: ProgressBarProps) {
  if (target <= 0) return null;

  const percent = Math.min((current / target) * 100, 150); // cap at 150% visually
  const prPercent = prTarget && prTarget > 0 ? Math.min((prTarget / target) * 100, 150) : null;
  const currentPercent = Math.round((current / target) * 100);
  const exceeds = current >= target;

  return (
    <div className="w-full">
      {/* Label row */}
      {(label || showPercent) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <span className="text-[10px] text-text-secondary uppercase tracking-wide">{label}</span>
          )}
          {showPercent && (
            <span className={`text-[10px] font-bold ${exceeds ? 'text-success' : 'text-text-secondary'}`}>
              {currentPercent}%
            </span>
          )}
        </div>
      )}

      {/* Bar */}
      <div className="relative h-2 bg-bg-secondary rounded-full overflow-hidden">
        {/* Current progress fill */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out ${
            exceeds ? 'bg-success' : 'bg-accent'
          }`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />

        {/* Overflow glow (past 100%) */}
        {exceeds && (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-success/30"
            style={{ width: '100%' }}
          />
        )}

        {/* PR marker line */}
        {prPercent != null && prPercent > 0 && prPercent <= 150 && (
          <div
            className="absolute inset-y-0 w-0.5 bg-yellow-400 z-10"
            style={{ left: `${Math.min(prPercent, 100)}%` }}
            title="PR"
          />
        )}

        {/* Target line at 100% */}
        <div className="absolute inset-y-0 right-0 w-px bg-text-secondary/30" />
      </div>
    </div>
  );
}
