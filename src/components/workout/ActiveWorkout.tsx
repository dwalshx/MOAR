import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { workoutService } from '../../services/workoutService';
import { generateWorkoutSummary } from '../../services/comparisonService';
import { setVolume } from '../../utils/formatters';
import { settingsService } from '../../services/settingsService';
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
  const [previousWorkoutVolume, setPreviousWorkoutVolume] = useState<number | null>(null);
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

  // Live total volume for current workout
  const currentWorkoutVolume = useLiveQuery(async () => {
    const exs = await db.workoutExercises.where('workoutId').equals(workoutId).toArray();
    if (exs.length === 0) return 0;
    const sets = await db.workoutSets
      .where('workoutExerciseId').anyOf(exs.map(e => e.id!)).toArray();
    const bw = settingsService.getBodyWeight();
    return sets.reduce((sum, s) => sum + setVolume(s.weight, s.reps, bw), 0);
  }, [workoutId]);

  // Fetch previous workout volume on mount
  useEffect(() => {
    if (!workout?.name) return;
    workoutService.getRecentWorkouts(10).then(recents => {
      // Find the most recent completed workout with the same name (excluding current)
      const prev = recents.find(r => r.name === workout.name && r.id !== workoutId);
      setPreviousWorkoutVolume(prev ? prev.totalVolume : null);
    });
  }, [workout?.name, workoutId]);

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

  const handleDeleteExercise = async (exerciseId: number) => {
    await workoutService.deleteExercise(exerciseId);
    if (expandedExerciseId === exerciseId) {
      setExpandedExerciseId(null);
    }
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
      <WorkoutHeader
        workout={workout}
        onFinish={handleFinish}
        currentVolume={currentWorkoutVolume ?? 0}
        previousVolume={previousWorkoutVolume}
      />

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
              workoutId={workoutId}
              isExpanded={expandedExerciseId === exercise.id}
              onToggle={() => handleToggle(exercise.id!)}
              onDelete={handleDeleteExercise}
            />
          ))}
        </div>
      )}
    </div>
  );
}
