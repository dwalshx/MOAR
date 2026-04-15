import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth';
import { sync, subscribeSyncState, getSyncState, onSignOut } from '../services/syncService';
import type { SyncStatus } from '../services/syncService';

/**
 * Auto-sync behavior:
 *   - On sign-in: full sync (pulls existing cloud data, then pushes local).
 *   - On interval (30s): periodic sync while signed in.
 *   - On visibility change (tab focus): sync.
 *   - On online: sync (catches up after being offline).
 *   - On sign-out: clear local DB + reset sync state.
 */
export function useAutoSync(): { status: SyncStatus; lastSyncAt: Date | null; error: string | null } {
  const { user } = useAuth();
  const [state, setState] = useState(getSyncState);
  const prevUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    return subscribeSyncState(setState);
  }, []);

  useEffect(() => {
    if (!user) {
      // Detect sign-out (had user, now don't)
      if (prevUserIdRef.current) {
        onSignOut();
        prevUserIdRef.current = undefined;
      }
      return;
    }

    prevUserIdRef.current = user.id;

    // Initial sync on login
    sync(user.id);

    // Periodic sync every 30 seconds while active
    const interval = setInterval(() => sync(user.id), 30_000);

    // Sync on visibility change
    const onVisibility = () => {
      if (document.visibilityState === 'visible') sync(user.id);
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Sync when online again
    const onOnline = () => sync(user.id);
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
    };
  }, [user]);

  return { status: state.status, lastSyncAt: state.lastSyncAt, error: state.error };
}
