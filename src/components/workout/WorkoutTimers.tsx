import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { settingsService } from '../../services/settingsService';
import { playDing, vibrate } from '../../lib/audio';

interface WorkoutTimersProps {
  workoutId: string;
  workoutStartedAt: Date;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}:${secs.toString().padStart(2, '0')}`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function WorkoutTimers({ workoutId, workoutStartedAt }: WorkoutTimersProps) {
  const [now, setNow] = useState(() => Date.now());
  const restTarget = settingsService.getRestTarget();
  const restSound = settingsService.getRestSound();

  // Per-set-time we've already alerted on, so we don't ding repeatedly
  const alertedForRef = useRef<number | null>(null);

  // Tick once per second
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Find the most recent set timestamp across all exercises in this workout
  const lastSetTime = useLiveQuery(async () => {
    const exs = await db.workoutExercises
      .where('workoutId').equals(workoutId)
      .filter(e => !e.deleted).toArray();
    if (exs.length === 0) return null;
    const sets = await db.workoutSets
      .where('workoutExerciseId').anyOf(exs.map(e => e.id))
      .filter(s => !s.deleted).toArray();
    if (sets.length === 0) return null;
    return sets.reduce((max, s) =>
      s.timestamp.getTime() > max ? s.timestamp.getTime() : max, 0);
  }, [workoutId]);

  const elapsedSec = Math.max(0, Math.floor((now - workoutStartedAt.getTime()) / 1000));
  const restSec = lastSetTime ? Math.max(0, Math.floor((now - lastSetTime) / 1000)) : null;

  // Fire the ding when rest crosses target — but only once per set
  useEffect(() => {
    if (!lastSetTime || !restTarget || !restSec) return;
    if (restSec >= restTarget && alertedForRef.current !== lastSetTime) {
      alertedForRef.current = lastSetTime;
      if (restSound) playDing();
      vibrate([100, 50, 100]);
    }
  }, [restSec, restTarget, restSound, lastSetTime]);

  // Color coding: target met → accent, otherwise gradients of secondary→success
  const restColor = restSec === null ? 'text-text-secondary'
    : restTarget && restSec >= restTarget ? 'text-accent'
    : restSec >= 90 ? 'text-success'
    : 'text-text-secondary';

  return (
    <div className="flex items-center gap-4 text-xs text-text-secondary tabular-nums">
      <div className="flex items-center gap-1">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="font-medium">{formatDuration(elapsedSec)}</span>
      </div>
      {restSec !== null && (
        <div className={`flex items-center gap-1 ${restColor}`}>
          <span className="opacity-70">rest</span>
          <span className="font-medium">{formatDuration(restSec)}</span>
          {restTarget > 0 && (
            <span className="opacity-50 text-[10px]">/ {formatDuration(restTarget)}</span>
          )}
        </div>
      )}
    </div>
  );
}
