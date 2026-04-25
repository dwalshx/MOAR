import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number; // ms
}

/**
 * Smoothly tweens from previous value to new value when value changes.
 * Used for the volume tally in WorkoutHeader so logging a set feels
 * like a number rolling up.
 */
export default function AnimatedNumber({ value, duration = 600 }: AnimatedNumberProps) {
  const [displayed, setDisplayed] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === displayed) return;
    fromRef.current = displayed;
    startRef.current = null;

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(fromRef.current + (value - fromRef.current) * eased);
      setDisplayed(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayed(value);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <>{displayed.toLocaleString()}</>;
}
