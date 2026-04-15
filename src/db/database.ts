import Dexie, { type Table } from 'dexie';
import type { Workout, WorkoutExercise, WorkoutSet, WorkoutTemplate } from './models';
import { uuid } from './models';

export class MoarDatabase extends Dexie {
  workouts!: Table<Workout, string>;
  workoutExercises!: Table<WorkoutExercise, string>;
  workoutSets!: Table<WorkoutSet, string>;
  workoutTemplates!: Table<WorkoutTemplate, string>;

  constructor() {
    super('moar');

    // V1: original auto-increment numeric IDs
    this.version(1).stores({
      workouts: '++id, name, startedAt, templateId, completedAt',
      workoutExercises: '++id, workoutId, exerciseName, [workoutId+order]',
      workoutSets: '++id, workoutExerciseId, timestamp',
      workoutTemplates: '++id, name, lastUsed',
    });

    // V2: UUID string IDs + sync metadata (updatedAt, deleted)
    // Primary keys migrate from number → string UUID; foreign keys are remapped
    // to preserve referential integrity; sync fields are initialized.
    this.version(2)
      .stores({
        workouts: 'id, name, startedAt, templateId, completedAt, updatedAt, deleted',
        workoutExercises: 'id, workoutId, exerciseName, [workoutId+order], updatedAt, deleted',
        workoutSets: 'id, workoutExerciseId, timestamp, updatedAt, deleted',
        workoutTemplates: 'id, name, lastUsed, updatedAt, deleted',
      })
      .upgrade(async (trans) => {
        const now = new Date();

        // 1. Migrate workouts: assign new UUIDs, track mapping
        const workoutIdMap = new Map<number, string>();
        const oldWorkouts = await trans.table('workouts').toArray();
        await trans.table('workouts').clear();
        for (const w of oldWorkouts) {
          const newId = uuid();
          workoutIdMap.set(w.id, newId);
          await trans.table('workouts').add({
            id: newId,
            name: w.name,
            templateId: w.templateId != null ? String(w.templateId) : undefined,
            startedAt: w.startedAt,
            completedAt: w.completedAt,
            notes: w.notes,
            updatedAt: now,
            deleted: false,
          });
        }

        // 2. Migrate workoutExercises: remap FK to workoutId
        const exerciseIdMap = new Map<number, string>();
        const oldExercises = await trans.table('workoutExercises').toArray();
        await trans.table('workoutExercises').clear();
        for (const e of oldExercises) {
          const newId = uuid();
          exerciseIdMap.set(e.id, newId);
          const newWorkoutId = workoutIdMap.get(e.workoutId);
          if (!newWorkoutId) continue; // orphaned, drop
          await trans.table('workoutExercises').add({
            id: newId,
            workoutId: newWorkoutId,
            exerciseName: e.exerciseName,
            order: e.order,
            updatedAt: now,
            deleted: false,
          });
        }

        // 3. Migrate workoutSets: remap FK to workoutExerciseId
        const oldSets = await trans.table('workoutSets').toArray();
        await trans.table('workoutSets').clear();
        for (const s of oldSets) {
          const newExerciseId = exerciseIdMap.get(s.workoutExerciseId);
          if (!newExerciseId) continue; // orphaned, drop
          await trans.table('workoutSets').add({
            id: uuid(),
            workoutExerciseId: newExerciseId,
            setNumber: s.setNumber,
            weight: s.weight,
            reps: s.reps,
            timestamp: s.timestamp,
            updatedAt: now,
            deleted: false,
          });
        }

        // 4. Migrate workoutTemplates
        const oldTemplates = await trans.table('workoutTemplates').toArray();
        await trans.table('workoutTemplates').clear();
        for (const t of oldTemplates) {
          await trans.table('workoutTemplates').add({
            id: uuid(),
            name: t.name,
            lastUsed: t.lastUsed,
            exercises: t.exercises,
            updatedAt: now,
            deleted: false,
          });
        }
      });
  }
}

export const db = new MoarDatabase();
