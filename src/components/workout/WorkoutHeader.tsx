import { useState, useCallback, useRef, useEffect } from 'react';
import type { Workout } from '../../db/models';
import { workoutService } from '../../services/workoutService';

interface WorkoutHeaderProps {
  workout: Workout;
  onFinish: () => void;
}

export default function WorkoutHeader({ workout, onFinish }: WorkoutHeaderProps) {
  const [name, setName] = useState(workout.name);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync name from prop when it changes externally (recovery scenario)
  useEffect(() => {
    setName(workout.name);
  }, [workout.name]);

  // Cleanup timer on unmount
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

  return (
    <div className="flex items-center justify-between py-2">
      <input
        type="text"
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        className="text-xl font-bold text-text-primary bg-transparent border-b border-transparent focus:border-accent outline-none truncate mr-4 min-w-0 flex-1"
        placeholder="Workout name"
      />
      <button
        type="button"
        className="bg-success text-white px-4 py-2 rounded-lg font-semibold
                   min-h-[44px] whitespace-nowrap active:opacity-80 transition-opacity"
        onClick={onFinish}
      >
        Finish
      </button>
    </div>
  );
}
