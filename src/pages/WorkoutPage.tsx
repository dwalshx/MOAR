import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import ActiveWorkout from '../components/workout/ActiveWorkout';

export default function WorkoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const parsedId = Number(id);

  useEffect(() => {
    if (isNaN(parsedId)) {
      navigate('/', { replace: true });
    }
  }, [parsedId, navigate]);

  const workout = useLiveQuery(
    () => (isNaN(parsedId) ? undefined : db.workouts.get(parsedId)),
    [parsedId]
  );

  useEffect(() => {
    if (workout && workout.completedAt) {
      navigate('/', { replace: true });
    }
  }, [workout, navigate]);

  if (isNaN(parsedId)) {
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

  return <ActiveWorkout workoutId={parsedId} />;
}
