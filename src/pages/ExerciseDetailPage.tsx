import { useParams } from 'react-router';

export default function ExerciseDetailPage() {
  const { name } = useParams();
  return (
    <div className="pt-6">
      <h1 className="text-2xl font-bold text-text-primary">{decodeURIComponent(name || '')}</h1>
      <p className="mt-2 text-text-secondary">Exercise history coming in Phase 5.</p>
    </div>
  );
}
