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

  // When 4+ increments, stack as two rows (minus row top, value, plus row bottom)
  // to keep buttons big enough to tap on mobile.
  const stacked = increments.length >= 4;

  const minusButton = (inc: number, i: number) => (
    <button
      key={`minus-${inc}`}
      type="button"
      className={`min-w-[38px] min-h-[40px] flex items-center justify-center
                 border rounded-lg text-sm font-bold flex-1
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
  );

  const plusButton = (inc: number, i: number, arr: number[]) => (
    <button
      key={`plus-${inc}`}
      type="button"
      className={`min-w-[38px] min-h-[40px] flex items-center justify-center
                 border rounded-lg text-sm font-bold flex-1
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
  );

  if (stacked) {
    return (
      <div
        className="flex flex-col gap-1.5 select-none w-full max-w-[420px]"
        style={{ touchAction: 'manipulation' }}
      >
        {/* Minus row */}
        <div className="flex items-center gap-1">
          {increments.map((inc, i) => minusButton(inc, i))}
        </div>

        {/* Value */}
        <div className="flex flex-col items-center min-h-[44px] py-1">
          <span className="text-3xl font-black text-text-primary tabular-nums">{displayValue}</span>
          {label && (
            <span className="text-[10px] text-text-secondary leading-none">{label}</span>
          )}
        </div>

        {/* Plus row (smallest first) */}
        <div className="flex items-center gap-1">
          {[...increments].reverse().map((inc, i, arr) => plusButton(inc, i, arr))}
        </div>
      </div>
    );
  }

  // Compact single-row layout for fewer increments
  return (
    <div
      className="flex items-center gap-1 select-none"
      style={{ touchAction: 'manipulation' }}
    >
      {increments.map((inc, i) => minusButton(inc, i))}

      <div className="flex flex-col items-center min-w-[48px] px-1.5">
        <span className="text-2xl font-black text-text-primary">{displayValue}</span>
        {label && (
          <span className="text-[10px] text-text-secondary leading-none">{label}</span>
        )}
      </div>

      {[...increments].reverse().map((inc, i, arr) => plusButton(inc, i, arr))}
    </div>
  );
}
