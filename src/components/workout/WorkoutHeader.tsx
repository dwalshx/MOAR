import { useState, useCallback, useRef, useEffect } from 'react';
import type { Workout } from '../../db/models';
import { workoutService } from '../../services/workoutService';
import { formatVolume } from '../../utils/formatters';
import ProgressBar from './ProgressBar';
import WorkoutTimers from './WorkoutTimers';
import AnimatedNumber from './AnimatedNumber';
import NotesEditor from './NotesEditor';

interface WorkoutHeaderProps {
  workout: Workout;
  onFinish: () => void;
  currentVolume?: number;
  previousVolume?: number | null;
}

export default function WorkoutHeader({
  workout,
  onFinish,
  currentVolume = 0,
  previousVolume,
}: WorkoutHeaderProps) {
  const [name, setName] = useState(workout.name);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setName(workout.name);
  }, [workout.name]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleNameChange = useCallback(
    (newName: string) => {
      setName(newName);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        workoutService.updateWorkoutName(workout.id!, newName);
      }, 500);
    },
    [workout.id]
  );

  const hasComparison = previousVolume != null && previousVolume > 0;

  return (
    <div>
      <div className="flex items-center justify-between py-2">
        <div className="flex flex-col min-w-0 flex-1 mr-3">
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="text-xl font-bold text-text-primary bg-transparent border-b border-transparent focus:border-accent outline-none truncate"
            placeholder="Workout name"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <DateEditor
              workoutId={workout.id}
              date={workout.startedAt}
            />
            <WorkoutTimers workoutId={workout.id} workoutStartedAt={workout.startedAt} />
          </div>
        </div>
        <button
          type="button"
          className="bg-success text-white px-4 py-2 rounded-lg font-semibold
                     min-h-[44px] whitespace-nowrap active:opacity-80 transition-opacity"
          onClick={onFinish}
        >
          Finish
        </button>
      </div>

      {/* Live volume tally — always visible, shows the running total */}
      <div className="bg-bg-card/60 rounded-lg px-4 py-3 mt-2 flex items-center justify-between">
        <span className="text-text-secondary text-xs uppercase tracking-wide">
          {hasComparison ? 'Volume' : 'Volume moved'}
        </span>
        <span className="text-2xl font-black text-accent tabular-nums">
          <AnimatedNumber value={currentVolume} />
          <span className="text-sm text-text-secondary font-medium ml-1">lbs</span>
        </span>
      </div>

      {/* Workout-level progress bar — only shown when there's a previous to beat */}
      {hasComparison && (
        <div className="mt-2">
          <ProgressBar
            current={currentVolume}
            target={previousVolume}
            label={`vs last time: ${formatVolume(previousVolume)}`}
          />
        </div>
      )}

      {/* Workout-level notes */}
      <div className="mt-2">
        <NotesEditor
          value={workout.notes}
          onChange={(notes) => workoutService.updateWorkoutNotes(workout.id, notes)}
          placeholder="Note for this workout..."
        />
      </div>
    </div>
  );
}

function DateEditor({ workoutId, date }: { workoutId: string; date: Date }) {
  const [editing, setEditing] = useState(false);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // ISO date for input[type=date]
  const isoDate = date.toISOString().slice(0, 10);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-text-secondary active:text-accent transition-colors flex items-center gap-1"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {dateStr}
      </button>
    );
  }

  return (
    <input
      type="date"
      defaultValue={isoDate}
      autoFocus
      onBlur={() => setEditing(false)}
      onChange={async (e) => {
        const v = e.target.value;
        if (v) {
          // Parse as local date (YYYY-MM-DD), not UTC, to avoid timezone shift
          const [y, m, d] = v.split('-').map(Number);
          const newDate = new Date(y, m - 1, d);
          await workoutService.updateWorkoutDate(workoutId, newDate);
        }
        setEditing(false);
      }}
      className="bg-bg-card border border-accent rounded px-2 py-1 text-xs text-text-primary outline-none"
    />
  );
}
