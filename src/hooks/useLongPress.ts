import { useRef, useCallback } from 'react';

export interface LongPressHandlers {
  onTouchStart: () => void;
  onTouchEnd: () => void;
  onMouseDown: () => void;
  onMouseUp: () => void;
}

/**
 * React hook for tap vs long-press detection with auto-repeat.
 *
 * - Tap: quick press-release (under threshold) fires onTap
 * - Long press: hold past threshold fires onLongPress, then auto-repeats every 150ms
 */
export function useLongPress(
  onTap: () => void,
  onLongPress: () => void,
  threshold = 400
): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLongPress = useRef(false);

  const start = useCallback(() => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
      intervalRef.current = setInterval(onLongPress, 150);
    }, threshold);
  }, [onLongPress, threshold]);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isLongPress.current) onTap();
  }, [onTap]);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onMouseDown: start,
    onMouseUp: stop,
  };
}
