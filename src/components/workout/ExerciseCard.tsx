import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import type { WorkoutExercise } from '../../db/models';
import type { BadgeType } from '../../services/comparisonService';
import { getSetBadgesForExercise, getLastSessionSetsForExercise, suggestTarget } from '../../services/comparisonService';
import { workoutService } from '../../services/workoutService';
import { setVolume } from '../../utils/formatters';
import { settingsService } from '../../services/settingsService';
import SetRow from './SetRow';
import SetEntryForm from './SetEntryForm';
import Badge from './Badge';

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  workoutId: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function ExerciseCard({
  exercise,
  workoutId,
  isExpanded,
  onToggle,
}: ExerciseCardProps) {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [badges, setBadges] = useState<Map<number, BadgeType>>(new Map());
  const [isComeback, setIsComeback] = useState(false);
  const [nudgeText, setNudgeText] = useState<string | null>(null);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [previousVolume, setPreviousVolume] = useState<number | null>(null);

  const sets = useLiveQuery(
    () =>
      db.workoutSets
        .where('workoutExerciseId')
        .equals(exercise.id!)
        .sortBy('setNumber'),
    [exercise.id]
  );

  // Compute badges when sets change
  useEffect(() => {
    if (sets === undefined) return;
    getSetBadgesForExercise(exercise.id!, workoutId).then(result => {
      setBadges(result.badges);
      setIsComeback(result.isComeback);
    });
    // Compute current volume
    const bw = settingsService.getBodyWeight();
    const vol = sets.reduce((sum, s) => sum + setVolume(s.weight, s.reps, bw), 0);
    setCurrentVolume(vol);
  }, [sets, exercise.id, workoutId]);

  // Compute nudge text and previous volume on mount
  useEffect(() => {
    getLastSessionSetsForExercise(exercise.exerciseName, workoutId).then(result => {
      setNudgeText(suggestTarget(result.sets));
      setPreviousVolume(result.previousVolume > 0 ? result.previousVolume : null);
    });
  }, [exercise.exerciseName, workoutId]);

  // Scroll into view when expanded
  useEffect(() => {
    if (isExpanded && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [isExpanded]);

  const showVolumeUp = previousVolume != null && previousVolume > 0 && currentVolume > previousVolume;

  const handleLogSet = async (weight: number, reps: number) => {
    await workoutService.logSet(exercise.id!, weight, reps);
  };

  const handleUpdateSet = async (setId: number, weight: number, reps: number) => {
    await workoutService.updateSet(setId, weight, reps);
  };

  const handleDeleteSet = async (setId: number) => {
    await workoutService.deleteSet(setId);
  };

  // Loading state while useLiveQuery resolves
  if (sets === undefined) {
    return (
      <div className="bg-bg-card rounded-xl p-3 animate-pulse">
        <div className="h-6 bg-bg-secondary rounded w-1/2" />
      </div>
    );
  }

  const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;

  if (!isExpanded) {
    return (
      <div
        ref={cardRef}
        className="bg-bg-card rounded-xl p-3 cursor-pointer active:bg-bg-secondary
                   transition-colors"
        onClick={onToggle}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-text-primary truncate max-w-[60%]">
            {exercise.exerciseName}
          </span>
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <span>{sets.length} {sets.length === 1 ? 'set' : 'sets'}</span>
            {lastSet && (
              <span>
                {lastSet.weight} x {lastSet.reps}
              </span>
            )}
            {isComeback && <Badge type="Comeback" />}
            {showVolumeUp && <Badge type="Volume Up" />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={cardRef} className="bg-bg-card rounded-xl p-3 pb-4 transition-all duration-150">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
        role="button"
        tabIndex={0}
      >
        <span
          className="font-semibold text-accent cursor-pointer active:opacity-80 truncate max-w-[70%]"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/exercise/${encodeURIComponent(exercise.exerciseName)}`);
          }}
        >
          {exercise.exerciseName}
        </span>
        <svg
          className="w-5 h-5 text-text-secondary transition-transform rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Logged sets */}
      {sets.length > 0 && (
        <div className="mt-3 space-y-2">
          {sets.map((s) => (
            <SetRow
              key={s.id}
              set={s}
              badge={badges.get(s.id!) || null}
              onUpdate={handleUpdateSet}
              onDelete={handleDeleteSet}
            />
          ))}
        </div>
      )}

      {/* Set entry form */}
      <div className="mt-3">
        <SetEntryForm
          exerciseName={exercise.exerciseName}
          workoutExerciseId={exercise.id!}
          nudgeText={nudgeText}
          onLogSet={handleLogSet}
        />
      </div>
    </div>
  );
}
