import { useState, useEffect } from 'react';
import { workoutService } from '../../services/workoutService';
import Stepper from './Stepper';

interface SetEntryFormProps {
  exerciseName: string;
  workoutExerciseId: number;
  onLogSet: (weight: number, reps: number) => void;
}

export default function SetEntryForm({
  exerciseName,
  workoutExerciseId: _workoutExerciseId,
  onLogSet,
}: SetEntryFormProps) {
  const [weight, setWeight] = useState(45);
  const [reps, setReps] = useState(10);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    workoutService.getLastSetValues(exerciseName).then((last) => {
      if (cancelled) return;
      if (last) {
        setWeight(last.weight);
        setReps(last.reps);
      }
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [exerciseName]);

  const handleLogSet = () => {
    onLogSet(weight, reps);
  };

  if (!loaded) {
    return (
      <div className="py-4 text-center text-text-secondary text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Weight stepper row */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-text-secondary text-xs font-medium">Weight</span>
        <Stepper
          value={weight}
          increments={[10, 1, 0.5]}
          onChange={setWeight}
          min={0}
          label="lbs"
        />
      </div>

      {/* Reps stepper row */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-text-secondary text-xs font-medium">Reps</span>
        <Stepper
          value={reps}
          increments={[5, 1]}
          onChange={setReps}
          min={1}
          label="reps"
        />
      </div>

      {/* Log Set button */}
      <button
        type="button"
        className="w-full bg-accent text-white font-bold py-3 rounded-lg text-lg
                   min-h-[44px] active:bg-accent-hover transition-colors"
        onClick={handleLogSet}
      >
        Log Set
      </button>

    </div>
  );
}
