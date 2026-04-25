interface StepperProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  label?: string;
  increments?: number[];
  /**
   * Optional formatter for the button label. Receives the increment value.
   * Defaults to the increment itself. Useful for plate-pair mode where
   * tapping "+45" actually adds 90 (one plate per side).
   */
  buttonPrefix?: (inc: number) => string;
}

export default function Stepper({
  value,
  onChange,
  min = 0,
  label,
  increments = [10, 1],
  buttonPrefix,
}: StepperProps) {
  const clamp = (v: number) => Math.max(min, v);

  const displayValue = value % 1 === 0 ? value.toString() : value.toFixed(1);
  const fmtInc = (inc: number) =>
    buttonPrefix ? buttonPrefix(inc) : (inc % 1 === 0 ? inc.toString() : inc.toFixed(1));

  return (
    <div
      className="flex items-center gap-1 select-none"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Minus buttons (largest to smallest) */}
      {increments.map((inc, i) => (
        <button
          key={`minus-${inc}`}
          type="button"
          className={`min-w-[38px] min-h-[40px] flex items-center justify-center
                     border rounded-lg text-sm font-bold
                     active:bg-accent active:text-white active:border-accent
                     transition-all ${
                       i === 0
                         ? 'border-border text-text-secondary bg-bg-secondary'
                         : 'border-border/60 text-text-primary bg-bg-card'
                     }`}
          onClick={() => onChange(clamp(value - inc))}
        >
          -{fmtInc(inc)}
        </button>
      ))}

      {/* Value display */}
      <div className="flex flex-col items-center min-w-[48px] px-1.5">
        <span className="text-2xl font-black text-text-primary">{displayValue}</span>
        {label && (
          <span className="text-[10px] text-text-secondary leading-none">{label}</span>
        )}
      </div>

      {/* Plus buttons (smallest to largest) */}
      {[...increments].reverse().map((inc, i, arr) => (
        <button
          key={`plus-${inc}`}
          type="button"
          className={`min-w-[38px] min-h-[40px] flex items-center justify-center
                     border rounded-lg text-sm font-bold
                     active:bg-accent active:text-white active:border-accent
                     transition-all ${
                       i === arr.length - 1
                         ? 'border-border text-text-secondary bg-bg-secondary'
                         : 'border-border/60 text-text-primary bg-bg-card'
                     }`}
          onClick={() => onChange(clamp(value + inc))}
        >
          +{fmtInc(inc)}
        </button>
      ))}
    </div>
  );
}
