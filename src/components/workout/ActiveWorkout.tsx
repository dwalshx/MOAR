import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { workoutService } from '../../services/workoutService';
import { generateWorkoutSummary } from '../../services/comparisonService';
import type { WorkoutSummary as WorkoutSummaryData } from '../../services/comparisonService';
import WorkoutHeader from './WorkoutHeader';
import ExerciseInput from './ExerciseInput';
import ExerciseCard from './ExerciseCard';
import WorkoutSummary from './WorkoutSummary';

interface ActiveWorkoutProps {
  workoutId: number;
  onSummaryShow?: () => void;
}

export default function ActiveWorkout({ workoutId, onSummaryShow }: ActiveWorkoutProps) {
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);
  const [summary, setSummary] = useState<WorkoutSummaryData | null>(null);
  const navigate = useNavigate();

  const workout = useLiveQuery(
    () => db.workouts.get(workoutId),
    [workoutId]
  );

  const exercises = useLiveQuery(
    () =>
      db.workoutExercises
        .where('workoutId')
        .equals(workoutId)
        .sortBy('order'),
    [workoutId]
  );

  const handleAddExercise = async (name: string) => {
    const newId = await workoutService.addExercise(workoutId, name);
    setExpandedExerciseId(newId);
  };

  const handleFinish = async () => {
    // Generate summary BEFORE finishing (Pitfall 6: current workout must still be active)
    const summaryData = await generateWorkoutSummary(workoutId);
    await workoutService.finishWorkout(workoutId);
    onSummaryShow?.();
    setSummary(summaryData);
  };

  const handleToggle = (exerciseId: number) => {
    setExpandedExerciseId((prev) => (prev === exerciseId ? null : exerciseId));
  };

  // Show summary screen after finishing
  if (summary) {
    return <WorkoutSummary summary={summary} onDone={() => navigate('/')} />;
  }

  // Loading state while useLiveQuery resolves
  if (workout === undefined || exercises === undefined) {
    return (
      <div className="p-4 text-center text-text-secondary">Loading workout...</div>
    );
  }

  if (!workout) {
    return (
      <div className="p-4 text-center text-text-secondary">Workout not found.</div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <WorkoutHeader workout={workout} onFinish={handleFinish} />

      <ExerciseInput onAddExercise={handleAddExercise} />

      {exercises.length === 0 ? (
        <p className="text-text-secondary text-center py-8">
          Add your first exercise above to get started
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              isExpanded={expandedExerciseId === exercise.id}
              onToggle={() => handleToggle(exercise.id!)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
