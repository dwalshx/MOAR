import { useState } from 'react';
import type { WorkoutSet } from '../../db/models';
import type { BadgeType } from '../../services/comparisonService';
import { useSwipeToDelete } from '../../hooks/useSwipeToDelete';
import Stepper from './Stepper';
import Badge from './Badge';

interface SetRowProps {
  set: WorkoutSet;
  badge?: BadgeType | null;
  onUpdate: (setId: number, weight: number, reps: number) => void;
  onDelete: (setId: number) => void;
}

export default function SetRow({ set, badge, onUpdate, onDelete }: SetRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editWeight, setEditWeight] = useState(set.weight);
  const [editReps, setEditReps] = useState(set.reps);
  const { offset, showDelete, onTouchStart, onTouchMove, onTouchEnd, reset } =
    useSwipeToDelete();

  const handleTap = () => {
    if (!showDelete) {
      setEditWeight(set.weight);
      setEditReps(set.reps);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    onUpdate(set.id!, editWeight, editReps);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(set.id!);
    reset();
  };

  if (isEditing) {
    return (
      <div className="bg-bg-card rounded-lg px-3 py-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-sm">Set {set.setNumber}</span>
          <button
            type="button"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center
                       text-success font-bold text-lg"
            onClick={handleSave}
            aria-label="Save set"
          >
            ✓
          </button>
        </div>
        <div className="flex items-center justify-around gap-2">
          <Stepper
            value={editWeight}
            onTapIncrement={5}
            onLongPressIncrement={1}
            onChange={setEditWeight}
            min={0}
            label="lbs"
          />
          <Stepper
            value={editReps}
            onTapIncrement={1}
            onLongPressIncrement={1}
            onChange={setEditReps}
            min={1}
            label="reps"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Delete zone behind the row */}
      <div className="absolute inset-y-0 right-0 flex items-center bg-red-600 px-4">
        <button
          type="button"
          className="min-h-[44px] min-w-[60px] text-white font-semibold text-sm"
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>

      {/* Swipeable row */}
      <div
        className="bg-bg-card rounded-lg px-3 py-2 flex items-center justify-between
                   relative z-10 transition-transform"
        style={{ transform: `translateX(-${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleTap}
        role="button"
        tabIndex={0}
      >
        <span className="text-text-secondary text-sm">Set {set.setNumber}</span>
        <div className="flex items-center gap-4">
          <span className="text-text-primary font-medium text-sm">
            {set.weight} lbs
          </span>
          <span className="text-text-primary font-medium text-sm">
            {set.reps} reps
          </span>
          {badge && <Badge type={badge} />}
        </div>
      </div>
    </div>
  );
}
