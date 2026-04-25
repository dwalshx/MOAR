import { useState, useEffect, useMemo } from 'react';
import { workoutService } from '../../services/workoutService';
import { settingsService, computePlateBreakdown } from '../../services/settingsService';
import Stepper from './Stepper';

interface SetEntryFormProps {
  exerciseName: string;
  workoutExerciseId: string;
  barType?: string;
  onLogSet: (weight: number, reps: number) => void;
}

export default function SetEntryForm({
  exerciseName,
  workoutExerciseId: _workoutExerciseId,
  barType,
  onLogSet,
}: SetEntryFormProps) {
  const [weight, setWeight] = useState(45);
  const [reps, setReps] = useState(10);
  const [loaded, setLoaded] = useState(false);

  // Resolve the bar (if barType points to a barbell)
  const bar = useMemo(() => {
    if (barType?.startsWith('bar:')) {
      const id = barType.slice(4);
      return settingsService.getBarById(id);
    }
    return null;
  }, [barType]);

  const isBodyweight = barType === 'bodyweight';
  const plateMode = settingsService.getPlateMode();
  const plates = settingsService.getPlates();

  useEffect(() => {
    let cancelled = false;
    workoutService.getLastSetValues(exerciseName).then((last) => {
      if (cancelled) return;
      if (last) {
        setWeight(last.weight);
        setReps(last.reps);
      } else {
        // First time logging this exercise — set sensible default
        if (isBodyweight) {
          setWeight(0);
        } else if (bar) {
          setWeight(bar.weight);
        }
      }
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [exerciseName, isBodyweight, bar]);

  const handleLogSet = () => {
    onLogSet(weight, reps);
  };

  // Plate buttons: when plate mode is on AND we know the bar weight,
  // each plate button adds 2× the plate weight to total (one plate per side).
  const plateIncrements = useMemo(() => {
    if (!plateMode || !bar) return null;
    return plates.map(p => p * 2); // total weight contribution per plate-pair
  }, [plateMode, bar, plates]);

  // Plate breakdown for the current weight
  const breakdown = useMemo(() => {
    if (!bar) return null;
    return computePlateBreakdown(weight, bar.weight, plates);
  }, [weight, bar, plates]);

  if (!loaded) {
    return (
      <div className="py-4 text-center text-text-secondary text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Weight stepper row — hidden for bodyweight exercises */}
      {!isBodyweight && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-text-secondary text-xs font-medium">Weight</span>
          <Stepper
            value={weight}
            increments={plateIncrements ?? [10, 1, 0.5]}
            onChange={setWeight}
            min={0}
            label="lbs"
            buttonPrefix={plateIncrements ? (n) => formatPlateButton(n / 2) : undefined}
          />
          {bar && breakdown && (
            <PlateBreakdown bar={bar} breakdown={breakdown} weight={weight} />
          )}
        </div>
      )}

      {isBodyweight && (
        <div className="flex flex-col items-center gap-1 py-2">
          <span className="text-text-secondary text-xs font-medium">Weight</span>
          <span className="text-2xl font-black text-accent">Bodyweight</span>
        </div>
      )}

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

function formatPlateButton(plate: number): string {
  return plate % 1 === 0 ? plate.toString() : plate.toFixed(1);
}

function PlateBreakdown({
  bar,
  breakdown,
  weight,
}: {
  bar: { name: string; weight: number };
  breakdown: { perSide: number[]; remaining: number };
  weight: number;
}) {
  if (weight < bar.weight) {
    return (
      <span className="text-text-secondary text-xs mt-1">
        Below bar weight ({bar.weight} lbs)
      </span>
    );
  }
  if (weight === bar.weight) {
    return (
      <span className="text-text-secondary text-xs mt-1">
        Just the bar
      </span>
    );
  }
  const grouped = breakdown.perSide.reduce<Map<number, number>>((map, p) => {
    map.set(p, (map.get(p) ?? 0) + 1);
    return map;
  }, new Map());
  const parts = [...grouped.entries()].map(([p, count]) =>
    count > 1 ? `${count}×${p}` : `${p}`
  );
  return (
    <div className="text-text-secondary text-xs mt-1 text-center">
      <span>{bar.weight} bar + </span>
      <span className="text-accent font-semibold">{parts.join(' + ')}</span>
      <span> per side</span>
      {breakdown.remaining > 0.01 && (
        <span className="text-red-400 ml-2">(missing {breakdown.remaining.toFixed(1)})</span>
      )}
    </div>
  );
}
