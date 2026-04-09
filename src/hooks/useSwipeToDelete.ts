import { useRef, useState, useCallback } from 'react';

/**
 * Hook for detecting left-swipe gestures to reveal a delete action.
 *
 * Tracks horizontal touch distance and exposes offset, showDelete state, and reset.
 * showDelete triggers when swipe exceeds 60% of threshold.
 */
export function useSwipeToDelete(threshold = 80) {
  const startX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [showDelete, setShowDelete] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const diff = startX.current - e.touches[0].clientX;
    if (diff > 0) setOffset(Math.min(diff, threshold));
  }, [threshold]);

  const onTouchEnd = useCallback(() => {
    if (offset >= threshold * 0.6) {
      setShowDelete(true);
      setOffset(threshold);
    } else {
      setShowDelete(false);
      setOffset(0);
    }
  }, [offset, threshold]);

  const reset = useCallback(() => {
    setOffset(0);
    setShowDelete(false);
  }, []);

  return { offset, showDelete, onTouchStart, onTouchMove, onTouchEnd, reset };
}
