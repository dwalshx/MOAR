interface StepperProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  label?: string;
  increments?: number[];
}

export default function Stepper({
  value,
  onChange,
  min = 0,
  label,
  increments = [10, 1],
}: StepperProps) {
  const clamp = (v: number) => Math.max(min, v);

  // Format display: show decimal only if value has one
  const displayValue = value % 1 === 0 ? value.toString() : value.toFixed(1);

  return (
    <div
      className="flex items-center gap-1.5 select-none"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Minus buttons (largest to smallest) */}
      {increments.map((inc) => (
        <button
          key={`minus-${inc}`}
          type="button"
          className="min-w-[36px] min-h-[44px] flex items-center justify-center
                     bg-bg-card rounded-lg text-text-secondary text-sm font-semibold
                     active:bg-accent-hover active:text-white transition-colors"
          onClick={() => onChange(clamp(value - inc))}
        >
          -{inc % 1 === 0 ? inc : inc.toFixed(1)}
        </button>
      ))}

      {/* Value display */}
      <div className="flex flex-col items-center min-w-[44px] px-1">
        <span className="text-xl font-bold text-text-primary">{displayValue}</span>
        {label && (
          <span className="text-[10px] text-text-secondary leading-none">{label}</span>
        )}
      </div>

      {/* Plus buttons (smallest to largest) */}
      {[...increments].reverse().map((inc) => (
        <button
          key={`plus-${inc}`}
          type="button"
          className="min-w-[36px] min-h-[44px] flex items-center justify-center
                     bg-bg-card rounded-lg text-text-secondary text-sm font-semibold
                     active:bg-accent-hover active:text-white transition-colors"
          onClick={() => onChange(clamp(value + inc))}
        >
          +{inc % 1 === 0 ? inc : inc.toFixed(1)}
        </button>
      ))}
    </div>
  );
}
