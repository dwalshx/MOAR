import { useEffect, useRef } from 'react';

/**
 * Keeps the screen on while the component is mounted.
 * Re-acquires the lock when the page becomes visible again
 * (the lock is automatically released when the tab is hidden).
 *
 * Wake Lock API is supported in Chrome/Edge/Opera and Safari 16.4+.
 * On unsupported browsers, this is a silent no-op.
 */
export function useWakeLock(active: boolean = true): void {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active) return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let cancelled = false;

    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          lock.release();
          return;
        }
        wakeLockRef.current = lock;
        lock.addEventListener('release', () => {
          // Released by the system (e.g., tab hidden); we'll re-acquire on visibility
          wakeLockRef.current = null;
        });
      } catch {
        // Some browsers throw on inactive tab or low battery; silent fallback
      }
    };

    acquire();

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        acquire();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [active]);
}
