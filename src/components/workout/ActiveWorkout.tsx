import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { workoutService } from '../../services/workoutService';
import WorkoutHeader from './WorkoutHeader';
import ExerciseInput from './ExerciseInput';
import ExerciseCard from './ExerciseCard';

interface ActiveWorkoutProps {
  workoutId: number;
}

export default function ActiveWorkout({ workoutId }: ActiveWorkoutProps) {
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);

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
    await workoutService.finishWorkout(workoutId);
  };

  const handleToggle = (exerciseId: number) => {
    setExpandedExerciseId((prev) => (prev === exerciseId ? null : exerciseId));
  };

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
