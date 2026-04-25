import { useState, useCallback, useRef, useEffect } from 'react';
import type { Workout } from '../../db/models';
import { workoutService } from '../../services/workoutService';
import { formatVolume } from '../../utils/formatters';
import ProgressBar from './ProgressBar';
import WorkoutTimers from './WorkoutTimers';
import AnimatedNumber from './AnimatedNumber';

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
          <WorkoutTimers workoutId={workout.id} workoutStartedAt={workout.startedAt} />
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
    </div>
  );
}
