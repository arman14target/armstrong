"use client";

import { useCallback, useEffect, useState } from "react";
import { loadAppData, saveAppData, clearAllAppData } from "@/lib/storage";
import {
  BatchExercisePreset,
  createMoveFromPreset,
  getWorkoutBatch,
} from "@/lib/workoutBatches";
import {
  applyWorkoutTemplate,
  addCompletionDate,
  createCustomWorkoutDay,
  getWorkoutTemplate,
  isBuiltinWorkoutType,
  logWorkoutDayEntry,
  updateWorkoutMoves,
} from "@/lib/workouts";
import {
  AppData,
  SetConfig,
  createDefaultAppData,
  createDefaultMove,
  createDefaultSet,
} from "@/lib/types";
import { createFoodEntry, FoodEntry, NutritionProfile } from "@/lib/nutrition";

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
    (workoutId: string) => {
      persist((prev) => {
        const template = getWorkoutTemplate(prev, workoutId);
        if (!template) {
          return prev;
        }

        if (
          prev.activeSession?.workoutType === workoutId &&
          prev.activeSession.startedAt
        ) {
          return prev;
        }

        return {
          ...prev,
          activeSession: {
            workoutType: workoutId,
            startedAt: new Date().toISOString(),
            setWeights: {},
            setReps: {},
            completedSetIds: [],
            baselineWorkout: structuredClone(template),
          },
        };
      });
    },
    [persist],
  );

  const addMove = useCallback(
    (workoutId: string, name: string) => {
      persist((prev) => {
        const template = getWorkoutTemplate(prev, workoutId);
        if (!template) {
          return prev;
        }

        return {
          ...updateWorkoutMoves(prev, workoutId, (moves) => [
            ...moves,
            createDefaultMove(name),
          ]),
          workoutSetupSeen: {
            ...prev.workoutSetupSeen,
            [workoutId]: true,
          },
        };
      });
    },
    [persist],
  );

  const importWorkoutPresets = useCallback(
    (workoutId: string, exercises: BatchExercisePreset[]) => {
      if (exercises.length === 0) {
        return;
      }

      const importedMoves = exercises.map(createMoveFromPreset);

      persist((prev) => {
        const template = getWorkoutTemplate(prev, workoutId);
        if (!template) {
          return prev;
        }

        const existingMoves = template.moves;
        const moves =
          existingMoves.length === 0
            ? importedMoves
            : [...existingMoves, ...importedMoves];

        return {
          ...applyWorkoutTemplate(prev, workoutId, {
            ...template,
            moves,
          }),
          workoutSetupSeen: {
            ...prev.workoutSetupSeen,
            [workoutId]: true,
          },
        };
      });
    },
    [persist],
  );

  const importWorkoutBatch = useCallback(
    (workoutId: string, batchId: string) => {
      if (!isBuiltinWorkoutType(workoutId)) {
        return;
      }

      const batch = getWorkoutBatch(workoutId, batchId);
      if (!batch) {
        return;
      }

      importWorkoutPresets(workoutId, batch.exercises);
    },
    [importWorkoutPresets],
  );

  const markWorkoutSetupSeen = useCallback(
    (workoutId: string) => {
      persist((prev) => ({
        ...prev,
        workoutSetupSeen: {
          ...prev.workoutSetupSeen,
          [workoutId]: true,
        },
      }));
    },
    [persist],
  );

  const updateMoveName = useCallback(
    (workoutId: string, moveId: string, name: string) => {
      persist((prev) =>
        updateWorkoutMoves(prev, workoutId, (moves) =>
          moves.map((move) =>
            move.id === moveId ? { ...move, name } : move,
          ),
        ),
      );
    },
    [persist],
  );

  const deleteMove = useCallback(
    (workoutId: string, moveId: string) => {
      persist((prev) =>
        updateWorkoutMoves(prev, workoutId, (moves) =>
          moves.filter((move) => move.id !== moveId),
        ),
      );
    },
    [persist],
  );

  const addSet = useCallback(
    (workoutId: string, moveId: string) => {
      persist((prev) =>
        updateWorkoutMoves(prev, workoutId, (moves) =>
          moves.map((move) => {
            if (move.id !== moveId) {
              return move;
            }

            const lastSet = move.sets[move.sets.length - 1];
            const nextSet = createDefaultSet();
            if (lastSet) {
              nextSet.restSeconds = lastSet.restSeconds;
            }

            return { ...move, sets: [...move.sets, nextSet] };
          }),
        ),
      );
    },
    [persist],
  );

  const deleteSet = useCallback(
    (workoutId: string, moveId: string, setId: string) => {
      persist((prev) => {
        const session = prev.activeSession;
        let activeSession = session;

        if (session?.workoutType === workoutId) {
          const { [setId]: _removedWeight, ...setWeights } = session.setWeights;
          const { [setId]: _removedReps, ...setReps } = session.setReps ?? {};
          const completedSetIds = session.completedSetIds.filter(
            (id) => id !== setId,
          );
          const clearingRest = session.activeRestSetId === setId;

          activeSession = {
            ...session,
            setWeights,
            setReps,
            completedSetIds,
            activeRestSetId: clearingRest
              ? undefined
              : session.activeRestSetId,
            restEndsAt: clearingRest ? undefined : session.restEndsAt,
          };
        }

        return {
          ...updateWorkoutMoves(prev, workoutId, (moves) =>
            moves.map((move) =>
              move.id === moveId
                ? {
                    ...move,
                    sets: move.sets.filter((set) => set.id !== setId),
                  }
                : move,
            ),
          ),
          activeSession,
        };
      });
    },
    [persist],
  );

  const updateSet = useCallback(
    (
      workoutId: string,
      moveId: string,
      setId: string,
      updates: Partial<SetConfig>,
    ) => {
      persist((prev) =>
        updateWorkoutMoves(prev, workoutId, (moves) =>
          moves.map((move) =>
            move.id === moveId
              ? {
                  ...move,
                  sets: move.sets.map((set) =>
                    set.id === setId ? { ...set, ...updates } : set,
                  ),
                }
              : move,
          ),
        ),
      );
    },
    [persist],
  );

  const completeSet = useCallback(
    (
      workoutId: string,
      moveId: string,
      setId: string,
      weight: number,
      reps: number,
      restSeconds: number,
    ) => {
      persist((prev) => {
        const session = prev.activeSession;
        if (!session || session.workoutType !== workoutId) {
          return prev;
        }

        const template = getWorkoutTemplate(prev, workoutId);
        if (!template) {
          return prev;
        }

        const alreadyCompleted = session.completedSetIds.includes(setId);
        const completedSetIds = alreadyCompleted
          ? session.completedSetIds
          : [...session.completedSetIds, setId];

        const updatedMoves = template.moves.map((move) =>
          move.id === moveId
            ? {
                ...move,
                sets: move.sets.map((set) =>
                  set.id === setId ? { ...set, restSeconds } : set,
                ),
              }
            : move,
        );

        const nextTemplate = { ...template, moves: updatedMoves };
        const nextData = applyWorkoutTemplate(prev, workoutId, nextTemplate);

        if (alreadyCompleted) {
          return {
            ...nextData,
            activeSession: {
              ...session,
              setWeights: { ...session.setWeights, [setId]: weight },
              setReps: { ...(session.setReps ?? {}), [setId]: reps },
            },
          };
        }

        const shouldRest = restSeconds > 0;
        const restEndsAt = shouldRest
          ? new Date(Date.now() + restSeconds * 1000).toISOString()
          : undefined;

        return {
          ...nextData,
          activeSession: {
            ...session,
            setWeights: { ...session.setWeights, [setId]: weight },
            setReps: { ...(session.setReps ?? {}), [setId]: reps },
            completedSetIds,
            activeRestSetId: shouldRest ? setId : undefined,
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
    (workoutId: string) => {
      persist((prev) => {
        const session = prev.activeSession;
        if (!session || session.workoutType !== workoutId) {
          return prev;
        }

        const baselineWorkout =
          session.baselineWorkout ?? getWorkoutTemplate(prev, workoutId);
        if (!baselineWorkout) {
          return { ...prev, activeSession: null };
        }

        return {
          ...applyWorkoutTemplate(prev, workoutId, structuredClone(baselineWorkout)),
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
    (workoutId: string) => {
      persist((prev) => {
        const session = prev.activeSession;
        const template = getWorkoutTemplate(prev, workoutId);
        if (!template) {
          return prev;
        }

        const updatedMoves = template.moves.map((move) => ({
          ...move,
          sets: move.sets.map((set) => {
            const sessionWeight = session?.setWeights[set.id];
            const sessionReps = session?.setReps?.[set.id];
            if (sessionWeight !== undefined || sessionReps !== undefined) {
              return {
                ...set,
                ...(sessionWeight !== undefined
                  ? { lastWeight: sessionWeight }
                  : {}),
                ...(sessionReps !== undefined ? { lastReps: sessionReps } : {}),
              };
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
          ...applyWorkoutTemplate(prev, workoutId, {
            moves: updatedMoves,
            lastCompletedAt: completedAt,
            lastSessionDurationSeconds,
          }),
          workoutCompletionDates: addCompletionDate(
            prev.workoutCompletionDates,
            completedAt,
          ),
          workoutDayLog: logWorkoutDayEntry(prev.workoutDayLog, {
            workoutId,
            completedAt,
            durationSeconds: lastSessionDurationSeconds,
          }),
          activeSession: null,
        };
      });
    },
    [persist],
  );

  const addCustomDay = useCallback(
    (name: string) => {
      const customDay = createCustomWorkoutDay(name);
      persist((prev) => ({
        ...prev,
        customWorkouts: [...prev.customWorkouts, customDay],
      }));
      return customDay.id;
    },
    [persist],
  );

  const removeCustomDay = useCallback(
    (workoutId: string) => {
      persist((prev) => {
        const { [workoutId]: _removed, ...workoutSetupSeen } =
          prev.workoutSetupSeen ?? {};

        return {
          ...prev,
          customWorkouts: prev.customWorkouts.filter(
            (workout) => workout.id !== workoutId,
          ),
          workoutSetupSeen,
          activeSession:
            prev.activeSession?.workoutType === workoutId
              ? null
              : prev.activeSession,
        };
      });
    },
    [persist],
  );

  const getWorkout = useCallback(
    (workoutId: string) => getWorkoutTemplate(data, workoutId),
    [data],
  );

  const getSession = useCallback(
    () => data.activeSession,
    [data.activeSession],
  );

  const resetAll = useCallback(async () => {
    await clearAllAppData();
    setData(createDefaultAppData());
  }, []);

  const saveNutritionProfile = useCallback(
    (profile: NutritionProfile) => {
      persist((prev) => ({
        ...prev,
        nutritionProfile: profile,
      }));
    },
    [persist],
  );

  const addFoodEntry = useCallback(
    (
      dateKey: string,
      entry: Pick<FoodEntry, "name" | "calories" | "proteinG" | "carbsG" | "fatG">,
    ) => {
      persist((prev) => {
        const nextEntry = createFoodEntry(entry);
        const dayEntries = prev.foodLog?.[dateKey] ?? [];

        return {
          ...prev,
          foodLog: {
            ...prev.foodLog,
            [dateKey]: [...dayEntries, nextEntry],
          },
        };
      });
    },
    [persist],
  );

  const removeFoodEntry = useCallback(
    (dateKey: string, entryId: string) => {
      persist((prev) => {
        const dayEntries = prev.foodLog?.[dateKey];
        if (!dayEntries?.length) {
          return prev;
        }

        const nextDayEntries = dayEntries.filter((entry) => entry.id !== entryId);
        const nextFoodLog = { ...prev.foodLog };

        if (nextDayEntries.length === 0) {
          delete nextFoodLog[dateKey];
        } else {
          nextFoodLog[dateKey] = nextDayEntries;
        }

        return {
          ...prev,
          foodLog: nextFoodLog,
        };
      });
    },
    [persist],
  );

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
    addCustomDay,
    removeCustomDay,
    getWorkout,
    getSession,
    resetAll,
    saveNutritionProfile,
    addFoodEntry,
    removeFoodEntry,
  };
}
