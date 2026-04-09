import { useParams } from 'react-router';

export default function WorkoutPage() {
  const { id } = useParams();
  return (
    <div className="pt-6">
      <h1 className="text-2xl font-bold text-text-primary">Active Workout</h1>
      <p className="mt-2 text-text-secondary">Workout #{id} — logging coming in Phase 2.</p>
    </div>
  );
}
