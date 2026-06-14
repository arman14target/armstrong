"use client";

import { useCallback, useEffect, useState } from "react";
import { loadAppData, saveAppData, clearAllAppData } from "@/lib/storage";
import {
  BatchExercisePreset,
  createMoveFromPreset,
  getWorkoutBatch,
} from "@/lib/workoutBatches";
import {
  AppData,
  SetConfig,
  WorkoutType,
  createDefaultAppData,
  createDefaultMove,
  createDefaultSet,
} from "@/lib/types";

export function useGymStore() {
  const [data, setData] = useState<AppData>(createDefaultAppData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadAppData());
    setHydrated(true);
  }, []);

  const persist = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      saveAppData(next);
      return next;
    });
  }, []);

  const startSession = useCallback(
    (workoutType: WorkoutType) => {
      persist((prev) => {
        if (
          prev.activeSession?.workoutType === workoutType &&
          prev.activeSession.startedAt
        ) {
          return prev;
        }
        return {
          ...prev,
          activeSession: {
            workoutType,
            startedAt: new Date().toISOString(),
            setWeights: {},
            completedSetIds: [],
            baselineWorkout: structuredClone(prev.workouts[workoutType]),
          },
        };
      });
    },
    [persist],
  );

  const addMove = useCallback(
    (workoutType: WorkoutType, name: string) => {
      persist((prev) => ({
        ...prev,
        workouts: {
          ...prev.workouts,
          [workoutType]: {
            ...prev.workouts[workoutType],
            moves: [...prev.workouts[workoutType].moves, createDefaultMove(name)],
          },
        },
        workoutSetupSeen: {
          ...prev.workoutSetupSeen,
          [workoutType]: true,
        },
      }));
    },
    [persist],
  );

  const importWorkoutPresets = useCallback(
    (workoutType: WorkoutType, exercises: BatchExercisePreset[]) => {
      if (exercises.length === 0) {
        return;
      }

      const importedMoves = exercises.map(createMoveFromPreset);

      persist((prev) => {
        const existingMoves = prev.workouts[workoutType].moves;
        const moves =
          existingMoves.length === 0
            ? importedMoves
            : [...existingMoves, ...importedMoves];

        return {
          ...prev,
          workouts: {
            ...prev.workouts,
            [workoutType]: {
              ...prev.workouts[workoutType],
              moves,
            },
          },
          workoutSetupSeen: {
            ...prev.workoutSetupSeen,
            [workoutType]: true,
          },
        };
      });
    },
    [persist],
  );

  const importWorkoutBatch = useCallback(
    (workoutType: WorkoutType, batchId: string) => {
      const batch = getWorkoutBatch(workoutType, batchId);
      if (!batch) {
        return;
      }

      importWorkoutPresets(workoutType, batch.exercises);
    },
    [importWorkoutPresets],
  );

  const markWorkoutSetupSeen = useCallback(
    (workoutType: WorkoutType) => {
      persist((prev) => ({
        ...prev,
        workoutSetupSeen: {
          ...prev.workoutSetupSeen,
          [workoutType]: true,
        },
      }));
    },
    [persist],
  );

  const updateMoveName = useCallback(
    (workoutType: WorkoutType, moveId: string, name: string) => {
      persist((prev) => ({
        ...prev,
        workouts: {
          ...prev.workouts,
          [workoutType]: {
            ...prev.workouts[workoutType],
            moves: prev.workouts[workoutType].moves.map((move) =>
              move.id === moveId ? { ...move, name } : move,
            ),
          },
        },
      }));
    },
    [persist],
  );

  const deleteMove = useCallback(
    (workoutType: WorkoutType, moveId: string) => {
      persist((prev) => ({
        ...prev,
        workouts: {
          ...prev.workouts,
          [workoutType]: {
            ...prev.workouts[workoutType],
            moves: prev.workouts[workoutType].moves.filter(
              (move) => move.id !== moveId,
            ),
          },
        },
      }));
    },
    [persist],
  );

  const addSet = useCallback(
    (workoutType: WorkoutType, moveId: string) => {
      persist((prev) => ({
        ...prev,
        workouts: {
          ...prev.workouts,
          [workoutType]: {
            ...prev.workouts[workoutType],
            moves: prev.workouts[workoutType].moves.map((move) =>
              move.id === moveId
                ? { ...move, sets: [...move.sets, createDefaultSet()] }
                : move,
            ),
          },
        },
      }));
    },
    [persist],
  );

  const deleteSet = useCallback(
    (workoutType: WorkoutType, moveId: string, setId: string) => {
      persist((prev) => {
        const session = prev.activeSession;
        let activeSession = session;

        if (session?.workoutType === workoutType) {
          const { [setId]: _removedWeight, ...setWeights } = session.setWeights;
          const completedSetIds = session.completedSetIds.filter(
            (id) => id !== setId,
          );
          const clearingRest = session.activeRestSetId === setId;

          activeSession = {
            ...session,
            setWeights,
            completedSetIds,
            activeRestSetId: clearingRest
              ? undefined
              : session.activeRestSetId,
            restEndsAt: clearingRest ? undefined : session.restEndsAt,
          };
        }

        return {
          ...prev,
          workouts: {
            ...prev.workouts,
            [workoutType]: {
              ...prev.workouts[workoutType],
              moves: prev.workouts[workoutType].moves.map((move) =>
                move.id === moveId
                  ? {
                      ...move,
                      sets: move.sets.filter((set) => set.id !== setId),
                    }
                  : move,
              ),
            },
          },
          activeSession,
        };
      });
    },
    [persist],
  );

  const updateSet = useCallback(
    (
      workoutType: WorkoutType,
      moveId: string,
      setId: string,
      updates: Partial<SetConfig>,
    ) => {
      persist((prev) => ({
        ...prev,
        workouts: {
          ...prev.workouts,
          [workoutType]: {
            ...prev.workouts[workoutType],
            moves: prev.workouts[workoutType].moves.map((move) =>
              move.id === moveId
                ? {
                    ...move,
                    sets: move.sets.map((set) =>
                      set.id === setId ? { ...set, ...updates } : set,
                    ),
                  }
                : move,
            ),
          },
        },
      }));
    },
    [persist],
  );

  const completeSet = useCallback(
    (
      workoutType: WorkoutType,
      moveId: string,
      setId: string,
      weight: number,
      restSeconds: number,
    ) => {
      persist((prev) => {
        const session = prev.activeSession;
        if (!session || session.workoutType !== workoutType) {
          return prev;
        }

        const alreadyCompleted = session.completedSetIds.includes(setId);
        const completedSetIds = alreadyCompleted
          ? session.completedSetIds
          : [...session.completedSetIds, setId];

        const restEndsAt = new Date(
          Date.now() + restSeconds * 1000,
        ).toISOString();

        const updatedMoves = prev.workouts[workoutType].moves.map((move) =>
          move.id === moveId
            ? {
                ...move,
                sets: move.sets.map((set) =>
                  set.id === setId ? { ...set, restSeconds } : set,
                ),
              }
            : move,
        );

        return {
          ...prev,
          workouts: {
            ...prev.workouts,
            [workoutType]: {
              ...prev.workouts[workoutType],
              moves: updatedMoves,
            },
          },
          activeSession: {
            ...session,
            setWeights: { ...session.setWeights, [setId]: weight },
            completedSetIds,
            activeRestSetId: setId,
            restEndsAt,
          },
        };
      });
    },
    [persist],
  );

  const clearSession = useCallback(() => {
    persist((prev) => {
      if (!prev.activeSession) {
        return prev;
      }
      return {
        ...prev,
        activeSession: null,
      };
    });
  }, [persist]);

  const cancelSession = useCallback(
    (workoutType: WorkoutType) => {
      persist((prev) => {
        const session = prev.activeSession;
        if (!session || session.workoutType !== workoutType) {
          return prev;
        }

        const baselineWorkout =
          session.baselineWorkout ?? prev.workouts[workoutType];

        return {
          ...prev,
          workouts: {
            ...prev.workouts,
            [workoutType]: structuredClone(baselineWorkout),
          },
          activeSession: null,
        };
      });
    },
    [persist],
  );

  const clearRestTimer = useCallback(() => {
    persist((prev) => {
      if (!prev.activeSession) {
        return prev;
      }
      return {
        ...prev,
        activeSession: {
          ...prev.activeSession,
          activeRestSetId: undefined,
          restEndsAt: undefined,
        },
      };
    });
  }, [persist]);

  const finishDay = useCallback(
    (workoutType: WorkoutType) => {
      persist((prev) => {
        const session = prev.activeSession;
        const workout = prev.workouts[workoutType];

        const updatedMoves = workout.moves.map((move) => ({
          ...move,
          sets: move.sets.map((set) => {
            const sessionWeight = session?.setWeights[set.id];
            if (sessionWeight !== undefined) {
              return { ...set, lastWeight: sessionWeight };
            }
            return set;
          }),
        }));

        const completedAt = new Date().toISOString();
        const lastSessionDurationSeconds = session?.startedAt
          ? Math.max(
              0,
              Math.floor(
                (Date.now() - new Date(session.startedAt).getTime()) / 1000,
              ),
            )
          : undefined;

        return {
          ...prev,
          workouts: {
            ...prev.workouts,
            [workoutType]: {
              moves: updatedMoves,
              lastCompletedAt: completedAt,
              lastSessionDurationSeconds,
            },
          },
          activeSession: null,
        };
      });
    },
    [persist],
  );

  const getWorkout = useCallback(
    (workoutType: WorkoutType) => data.workouts[workoutType],
    [data.workouts],
  );

  const getSession = useCallback(
    () => data.activeSession,
    [data.activeSession],
  );

  const resetAll = useCallback(async () => {
    await clearAllAppData();
    setData(createDefaultAppData());
  }, []);

  return {
    data,
    hydrated,
    startSession,
    addMove,
    importWorkoutBatch,
    importWorkoutPresets,
    markWorkoutSetupSeen,
    updateMoveName,
    deleteMove,
    addSet,
    deleteSet,
    updateSet,
    completeSet,
    clearRestTimer,
    clearSession,
    cancelSession,
    finishDay,
    getWorkout,
    getSession,
    resetAll,
  };
}
