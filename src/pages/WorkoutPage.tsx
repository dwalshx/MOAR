import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import ActiveWorkout from '../components/workout/ActiveWorkout';

export default function WorkoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showingSummary, setShowingSummary] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/', { replace: true });
    }
  }, [id, navigate]);

  const workout = useLiveQuery(
    () => (id ? db.workouts.get(id) : db.workouts.get('__none__')),
    [id]
  );

  useEffect(() => {
    if (workout && workout.completedAt && !showingSummary) {
      navigate('/', { replace: true });
    }
  }, [workout, navigate, showingSummary]);

  if (!id) {
    return null;
  }

  if (workout === undefined) {
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
    <ActiveWorkout
      workoutId={id}
      onSummaryShow={() => setShowingSummary(true)}
    />
  );
}
