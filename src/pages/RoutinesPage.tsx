import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { workoutService } from '../services/workoutService';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';

export default function RoutinesPage() {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);

  const routines = useLiveQuery(() => workoutService.getTemplates());

  const handleCreate = async () => {
    const id = await workoutService.createTemplate('New Routine');
    setEditingId(id);
  };

  const handleStart = async (templateId: string) => {
    const workoutId = await workoutService.startWorkoutFromTemplateId(templateId);
    if (workoutId) navigate(`/workout/${workoutId}`);
  };

  if (routines === undefined) return null;

  return (
    <div className="pt-6 pb-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="text-accent font-semibold min-h-[44px] active:opacity-80 transition-opacity"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-text-primary ml-2 flex-1">Routines</h1>
        <button
          onClick={handleCreate}
          className="bg-accent text-white text-sm font-semibold px-3 py-2 rounded-lg
                     min-h-[40px] active:bg-accent-hover transition-colors"
        >
          + New
        </button>
      </div>

      {routines.length === 0 ? (
        <div className="bg-bg-card rounded-xl p-6 text-center">
          <p className="text-text-secondary text-sm mb-3">
            No routines yet. Pre-build a workout so it's ready when you hit the gym.
          </p>
          <button
            onClick={handleCreate}
            className="bg-accent text-white font-semibold px-4 py-2 rounded-lg active:opacity-80"
          >
            Create your first routine
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {routines.map(r => (
            <RoutineCard
              key={r.id}
              routine={r}
              isEditing={editingId === r.id}
              onEdit={() => setEditingId(r.id)}
              onCloseEdit={() => setEditingId(null)}
              onStart={() => handleStart(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RoutineCard({
  routine,
  isEditing,
  onEdit,
  onCloseEdit,
  onStart,
}: {
  routine: { id: string; name: string; exercises: string[]; lastUsed: Date };
  isEditing: boolean;
  onEdit: () => void;
  onCloseEdit: () => void;
  onStart: () => void;
}) {
  const [name, setName] = useState(routine.name);
  const [exercises, setExercises] = useState(routine.exercises);
  const [newExercise, setNewExercise] = useState('');

  const saveName = async (n: string) => {
    setName(n);
    await workoutService.renameTemplate(routine.id, n);
  };

  const saveExercises = async (next: string[]) => {
    setExercises(next);
    await workoutService.setTemplateExercises(routine.id, next);
  };

  const addExercise = () => {
    const trimmed = newExercise.trim();
    if (!trimmed) return;
    saveExercises([...exercises, trimmed]);
    setNewExercise('');
  };

  const removeExercise = (idx: number) => {
    saveExercises(exercises.filter((_, i) => i !== idx));
  };

  const moveExercise = (idx: number, dir: -1 | 1) => {
    const next = [...exercises];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    saveExercises(next);
  };

  const handleDelete = async () => {
    if (confirm(`Delete routine "${routine.name}"?`)) {
      await workoutService.deleteTemplate(routine.id);
    }
  };

  // Suggestions for autocomplete: library entries not already in the routine
  const lowerExisting = new Set(exercises.map(e => e.toLowerCase()));
  const suggestions = newExercise.trim()
    ? EXERCISE_LIBRARY
        .filter(lib =>
          lib.toLowerCase().includes(newExercise.trim().toLowerCase()) &&
          !lowerExisting.has(lib.toLowerCase())
        )
        .slice(0, 5)
    : [];

  if (!isEditing) {
    return (
      <div className="bg-bg-card rounded-xl p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-text-primary font-semibold truncate">{routine.name}</h3>
            <p className="text-text-secondary text-xs mt-0.5">
              {exercises.length === 0
                ? 'No exercises yet'
                : exercises.length === 1
                  ? '1 exercise'
                  : `${exercises.length} exercises`}
            </p>
            {exercises.length > 0 && (
              <p className="text-text-secondary text-xs mt-1 truncate">
                {exercises.slice(0, 3).join(' · ')}
                {exercises.length > 3 ? ' …' : ''}
              </p>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={onEdit}
              className="text-text-secondary text-xs px-3 py-1.5 rounded-lg
                         border border-border active:border-accent transition-colors min-h-[36px]"
            >
              Edit
            </button>
            <button
              onClick={onStart}
              disabled={exercises.length === 0}
              className="bg-accent text-white text-xs font-semibold px-3 py-1.5 rounded-lg
                         disabled:opacity-40 active:opacity-80 transition-opacity min-h-[36px]"
            >
              Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-xl p-4 border border-accent/40">
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={name}
          onChange={(e) => saveName(e.target.value)}
          className="text-text-primary text-base font-bold bg-transparent
                     border-b border-border focus:border-accent outline-none flex-1 min-w-0 py-1"
        />
        <button
          onClick={handleDelete}
          className="text-red-500/60 active:text-red-500 px-2 py-1.5 transition-colors"
          aria-label="Delete routine"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Exercise list */}
      <div className="flex flex-col gap-1.5 mb-3">
        {exercises.length === 0 && (
          <p className="text-text-secondary text-xs italic">No exercises yet — add some below</p>
        )}
        {exercises.map((ex, i) => (
          <div
            key={`${ex}-${i}`}
            className="flex items-center gap-2 bg-bg-secondary rounded-lg px-3 py-2"
          >
            <span className="text-text-secondary text-xs w-5">{i + 1}.</span>
            <span className="text-text-primary text-sm flex-1 truncate">{ex}</span>
            <button
              onClick={() => moveExercise(i, -1)}
              disabled={i === 0}
              className="text-text-secondary disabled:opacity-30 active:text-accent text-sm w-7"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              onClick={() => moveExercise(i, 1)}
              disabled={i === exercises.length - 1}
              className="text-text-secondary disabled:opacity-30 active:text-accent text-sm w-7"
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              onClick={() => removeExercise(i)}
              className="text-red-500/60 active:text-red-500 text-base w-6"
              aria-label="Remove exercise"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add exercise */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={newExercise}
            onChange={(e) => setNewExercise(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addExercise();
              }
            }}
            placeholder="Add exercise..."
            className="bg-bg-secondary border border-border rounded-lg px-3 py-2 flex-1 min-w-0
                       text-text-primary text-sm outline-none focus:border-accent placeholder-text-secondary"
          />
          <button
            onClick={addExercise}
            disabled={!newExercise.trim()}
            className="bg-accent text-white text-sm font-semibold px-3 rounded-lg
                       disabled:opacity-40 active:opacity-80 transition-opacity"
          >
            Add
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-bg-secondary border border-border
                          rounded-lg overflow-hidden shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => {
                  saveExercises([...exercises, s]);
                  setNewExercise('');
                }}
                className="block w-full text-left px-3 py-2 text-sm text-text-primary
                           active:bg-bg-card transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={onCloseEdit}
          className="text-text-secondary text-sm font-medium px-3 py-2 active:text-accent"
        >
          Done
        </button>
        <button
          onClick={onStart}
          disabled={exercises.length === 0}
          className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-lg
                     disabled:opacity-40 active:opacity-80"
        >
          Start workout
        </button>
      </div>
    </div>
  );
}
