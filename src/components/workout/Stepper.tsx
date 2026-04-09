import { useCallback } from 'react';
import { useLongPress } from '../../hooks/useLongPress';

interface StepperProps {
  value: number;
  onTapIncrement: number;
  onLongPressIncrement: number;
  onChange: (newValue: number) => void;
  min?: number;
  label?: string;
}

export default function Stepper({
  value,
  onTapIncrement,
  onLongPressIncrement,
  onChange,
  min = 0,
  label,
}: StepperProps) {
  const clamp = useCallback(
    (v: number) => Math.max(min, v),
    [min]
  );

  // Minus button handlers
  const minusHandlers = useLongPress(
    () => onChange(clamp(value - onTapIncrement)),
    () => onChange(clamp(value - onLongPressIncrement)),
  );

  // Plus button handlers
  const plusHandlers = useLongPress(
    () => onChange(clamp(value + onTapIncrement)),
    () => onChange(clamp(value + onLongPressIncrement)),
  );

  const handleTouchStart = (
    handler: () => void
  ) => (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent context menu on long-press
    handler();
  };

  return (
    <div className="flex items-center gap-3 touch-action-manipulation select-none"
         style={{ touchAction: 'manipulation' }}>
      {/* Minus button */}
      <button
        type="button"
        className="min-w-[44px] min-h-[44px] flex items-center justify-center
                   bg-bg-card rounded-lg text-text-primary text-xl font-bold
                   active:bg-accent-hover transition-colors"
        onTouchStart={handleTouchStart(minusHandlers.onTouchStart)}
        onTouchEnd={minusHandlers.onTouchEnd}
        onMouseDown={minusHandlers.onMouseDown}
        onMouseUp={minusHandlers.onMouseUp}
      >
        -
      </button>

      {/* Value display */}
      <div className="flex flex-col items-center min-w-[48px]">
        <span className="text-2xl font-bold text-text-primary">
          {value}
        </span>
        {label && (
          <span className="text-xs text-text-secondary">{label}</span>
        )}
      </div>

      {/* Plus button */}
      <button
        type="button"
        className="min-w-[44px] min-h-[44px] flex items-center justify-center
                   bg-bg-card rounded-lg text-text-primary text-xl font-bold
                   active:bg-accent-hover transition-colors"
        onTouchStart={handleTouchStart(plusHandlers.onTouchStart)}
        onTouchEnd={plusHandlers.onTouchEnd}
        onMouseDown={plusHandlers.onMouseDown}
        onMouseUp={plusHandlers.onMouseUp}
      >
        +
      </button>
    </div>
  );
}
