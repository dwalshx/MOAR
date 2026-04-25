import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import type { WorkoutExercise } from '../../db/models';
import type { BadgeType, ExercisePR } from '../../services/comparisonService';
import { getSetBadgesForExercise, getLastSessionSetsForExercise, suggestTarget, getExercisePR } from '../../services/comparisonService';
import { workoutService } from '../../services/workoutService';
import { setVolume } from '../../utils/formatters';
import { settingsService } from '../../services/settingsService';
import SetRow from './SetRow';
import SetEntryForm from './SetEntryForm';
import Badge from './Badge';
import ProgressBar from './ProgressBar';
import AnimatedNumber from './AnimatedNumber';
import NotesEditor from './NotesEditor';
import BarTypeSelector from './BarTypeSelector';

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  workoutId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete?: (exerciseId: string) => void;
}

export default function ExerciseCard({
  exercise,
  workoutId,
  isExpanded,
  onToggle,
  onDelete,
}: ExerciseCardProps) {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [badges, setBadges] = useState<Map<string, BadgeType>>(new Map());
  const [isComeback, setIsComeback] = useState(false);
  const [nudgeText, setNudgeText] = useState<string | null>(null);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [previousVolume, setPreviousVolume] = useState<number | null>(null);
  const [pr, setPr] = useState<ExercisePR | null>(null);

  const sets = useLiveQuery(
    () =>
      db.workoutSets
        .where('workoutExerciseId')
        .equals(exercise.id)
        .sortBy('setNumber'),
    [exercise.id]
  );

  // Compute badges when sets change
  useEffect(() => {
    if (sets === undefined) return;
    getSetBadgesForExercise(exercise.id, workoutId).then(result => {
      setBadges(result.badges);
      setIsComeback(result.isComeback);
    });
    // Compute current volume
    const bw = settingsService.getBodyWeight();
    const vol = sets.reduce((sum, s) => sum + setVolume(s.weight, s.reps, bw), 0);
    setCurrentVolume(vol);
  }, [sets, exercise.id, workoutId]);

  // Compute nudge text, previous volume, and PR on mount
  useEffect(() => {
    getLastSessionSetsForExercise(exercise.exerciseName, workoutId).then(result => {
      setNudgeText(suggestTarget(result.sets));
      setPreviousVolume(result.previousVolume > 0 ? result.previousVolume : null);
    });
    getExercisePR(exercise.exerciseName).then(setPr);
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
    await workoutService.logSet(exercise.id, weight, reps);
  };

  const handleUpdateSet = async (setId: string, weight: number, reps: number) => {
    await workoutService.updateSet(setId, weight, reps);
  };

  const handleDeleteSet = async (setId: string) => {
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
        <div className="flex items-center gap-1">
          {onDelete && (
            <button
              type="button"
              className="min-w-[36px] min-h-[36px] flex items-center justify-center
                         text-red-500/60 hover:text-red-500 active:text-red-400 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Remove ${exercise.exerciseName} and all its sets?`)) {
                  onDelete(exercise.id);
                }
              }}
              aria-label="Delete exercise"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <svg
            className="w-5 h-5 text-text-secondary transition-transform rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Per-exercise live volume tally */}
      {sets.length > 0 && (
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-text-secondary uppercase tracking-wide">Volume</span>
          <span className="text-text-primary font-bold tabular-nums">
            <AnimatedNumber value={currentVolume} />
            <span className="text-text-secondary font-medium ml-1">lbs</span>
          </span>
        </div>
      )}

      {/* Progress toward last session + PR */}
      {previousVolume != null && previousVolume > 0 && (
        <div className="mt-2 px-1">
          <ProgressBar
            current={currentVolume}
            target={previousVolume}
            prTarget={pr ? pr.volume * (sets.length || 1) : null}
            label="vs last time"
          />
        </div>
      )}

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

      {/* Reference info: last time + PR */}
      {(nudgeText || pr) && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary px-1">
          {nudgeText && <span>{nudgeText}</span>}
          {pr && (
            <span className="text-yellow-400">
              PR: {pr.weight} x {pr.reps} ({pr.volume} lbs)
            </span>
          )}
        </div>
      )}

      {/* Set entry form */}
      <div className="mt-3">
        <SetEntryForm
          exerciseName={exercise.exerciseName}
          workoutExerciseId={exercise.id}
          barType={exercise.barType}
          onLogSet={handleLogSet}
        />
      </div>

      {/* Bar type selector + notes */}
      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
        <BarTypeSelector
          value={exercise.barType}
          onChange={(barType) => workoutService.updateExerciseBarType(exercise.id, barType)}
        />
        <NotesEditor
          value={exercise.notes}
          onChange={(notes) => workoutService.updateExerciseNotes(exercise.id, notes)}
          placeholder="Note for this exercise..."
        />
      </div>
    </div>
  );
}
