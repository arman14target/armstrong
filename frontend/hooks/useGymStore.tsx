"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { scheduleCloudSync, setCloudSyncUserId } from "@/lib/cloudSyncScheduler";
import { clearLocalOnlyChanges } from "@/lib/localSaveReminder";
import { loadAppData, saveAppData, clearAllAppData } from "@/lib/storage";
import {
  clearUserPlanEverywhere,
  syncUserPlanOnLogin,
  type SyncAuthMode,
} from "@/lib/userPlanSync";
import {
  BatchExercisePreset,
  createMoveFromPreset,
  getWorkoutBatch,
} from "@/lib/workoutBatches";
import { shouldReuseActiveSession } from "@/lib/activeSession";
import {
  applyWorkoutTemplate,
  addCompletionDate,
  createCustomWorkoutDay,
  getWorkoutTemplate,
  isBuiltinWorkoutType,
  logWorkoutDayEntry,
  updateCustomWorkoutName,
  updateWorkoutMoves,
} from "@/lib/workouts";
import {
  AppData,
  SetConfig,
  createDefaultAppData,
  createDefaultMove,
  createDefaultSet,
} from "@/lib/types";
import {
  applyDietPlan,
  type CoachDietPlan,
} from "@/lib/coachDiet";
import {
  applyGymPlan,
  applyWorkoutChange,
  type CoachGymPlan,
  type CoachWorkoutChange,
} from "@/lib/coachWorkout";
import { createFoodEntry, createPlannedFoodEntry, FoodEntry, NutritionProfile, PlannedMealInput } from "@/lib/nutrition";
import {
  applyDietPlannerImport,
  applyGymPlannerImport,
} from "@/lib/planner/plannerImport";
import { applyWelcomePlanImport, applyDefaultManualExercisePlan } from "@/lib/planner/welcomePlan";
import type { WelcomePlanInputs } from "@/lib/planner/welcomePlan";
import type { DietPlanInputs, DietPlanResult } from "@/lib/planner/dietPlan";
import type { GymPlanResult } from "@/lib/planner/gymPlan";

type GymStoreValue = ReturnType<typeof useGymStoreState>;

const GymStoreContext = createContext<GymStoreValue | null>(null);

let syncedUserId: string | null = null;

function useGymStoreState() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(createDefaultAppData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadAppData());
    setHydrated(true);
  }, []);

  useEffect(() => {
    setCloudSyncUserId(user?.id ?? null);
  }, [user?.id]);

  const syncForUser = useCallback(async (userId: string, mode: SyncAuthMode = "sign-in") => {
    const synced = await syncUserPlanOnLogin(userId, mode);
    setData((prev) => {
      const localSession =
        prev.activeSession ?? loadAppData().activeSession;
      if (!localSession) {
        return synced;
      }

      if (synced.activeSession === localSession) {
        return synced;
      }

      const merged = { ...synced, activeSession: localSession };
      saveAppData(merged);
      return merged;
    });
    clearLocalOnlyChanges();
    syncedUserId = userId;
  }, []);

  useEffect(() => {
    if (!user?.id) {
      syncedUserId = null;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!hydrated || !user?.id || syncedUserId === user.id) {
      return;
    }

    syncForUser(user.id).catch(() => {
      syncedUserId = user.id;
    });
  }, [hydrated, user?.id, syncForUser]);

  const persist = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      saveAppData(next);
      scheduleCloudSync();
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
          shouldReuseActiveSession(prev.activeSession, workoutId, template)
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

  const uncompleteSet = useCallback(
    (workoutId: string, moveId: string, setId: string) => {
      persist((prev) => {
        const session = prev.activeSession;
        if (!session || session.workoutType !== workoutId) {
          return prev;
        }

        if (!session.completedSetIds.includes(setId)) {
          return prev;
        }

        const clearingRest = session.activeRestSetId === setId;

        return {
          ...prev,
          activeSession: {
            ...session,
            completedSetIds: session.completedSetIds.filter((id) => id !== setId),
            activeRestSetId: clearingRest
              ? undefined
              : session.activeRestSetId,
            restEndsAt: clearingRest ? undefined : session.restEndsAt,
          },
        };
      });
    },
    [persist],
  );

  const reorderMoves = useCallback(
    (workoutId: string, fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) {
        return;
      }

      persist((prev) =>
        updateWorkoutMoves(prev, workoutId, (moves) => {
          if (
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= moves.length ||
            toIndex >= moves.length
          ) {
            return moves;
          }

          const next = [...moves];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);
          return next;
        }),
      );
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
            ...template,
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

  const renameCustomDay = useCallback(
    (workoutId: string, name: string) => {
      persist((prev) => updateCustomWorkoutName(prev, workoutId, name));
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
    if (user?.id) {
      await clearUserPlanEverywhere(user.id);
      syncedUserId = user.id;
    } else {
      await clearAllAppData();
    }
    clearLocalOnlyChanges();
    setData(createDefaultAppData());
  }, [user?.id]);

  const syncAfterAuth = useCallback(async (userId: string, mode: SyncAuthMode) => {
    syncedUserId = null;
    await syncForUser(userId, mode);
  }, [syncForUser]);

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

  const addPlannedFoodEntry = useCallback(
    (dateKey: string, entry: PlannedMealInput) => {
      persist((prev) => {
        const nextEntry = createPlannedFoodEntry(entry);
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

  const updatePlannedFoodEntry = useCallback(
    (dateKey: string, entryId: string, updates: PlannedMealInput) => {
      persist((prev) => {
        const dayEntries = prev.foodLog?.[dateKey];
        if (!dayEntries?.length) {
          return prev;
        }

        const nextDayEntries = dayEntries.map((entry) =>
          entry.id === entryId && entry.fromPlan
            ? { ...entry, ...updates }
            : entry,
        );

        return {
          ...prev,
          foodLog: {
            ...prev.foodLog,
            [dateKey]: nextDayEntries,
          },
        };
      });
    },
    [persist],
  );

  const applyCoachWorkoutChange = useCallback(
    (change: CoachWorkoutChange) => {
      persist((prev) => applyWorkoutChange(prev, change));
    },
    [persist],
  );

  const applyCoachGymPlan = useCallback(
    (plan: CoachGymPlan) => {
      persist((prev) => applyGymPlan(prev, plan));
    },
    [persist],
  );

  const applyCoachDietPlan = useCallback(
    (plan: CoachDietPlan, dateKey?: string) => {
      persist((prev) => applyDietPlan(prev, plan, dateKey));
    },
    [persist],
  );

  const importDietPlanner = useCallback(
    (inputs: DietPlanInputs, plan: DietPlanResult) => {
      persist((prev) => applyDietPlannerImport(prev, inputs, plan));
    },
    [persist],
  );

  const importGymPlanner = useCallback(
    (plan: GymPlanResult) => {
      persist((prev) => applyGymPlannerImport(prev, plan));
    },
    [persist],
  );

  const importWelcomePlan = useCallback(
    (inputs: WelcomePlanInputs) => {
      persist((prev) => applyWelcomePlanImport(prev, inputs));
    },
    [persist],
  );

  const importDefaultManualExercisePlan = useCallback(() => {
    persist((prev) => applyDefaultManualExercisePlan(prev));
  }, [persist]);

  const togglePlannedMealComplete = useCallback(
    (dateKey: string, entryId: string, completed: boolean) => {
      persist((prev) => {
        const dayEntries = prev.foodLog?.[dateKey];
        if (!dayEntries?.length) {
          return prev;
        }

        const nextDayEntries = dayEntries.map((entry) =>
          entry.id === entryId && entry.fromPlan
            ? { ...entry, completed }
            : entry,
        );

        return {
          ...prev,
          foodLog: {
            ...prev.foodLog,
            [dateKey]: nextDayEntries,
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
    uncompleteSet,
    reorderMoves,
    clearRestTimer,
    clearSession,
    cancelSession,
    finishDay,
    addCustomDay,
    removeCustomDay,
    renameCustomDay,
    getWorkout,
    getSession,
    resetAll,
    syncAfterAuth,
    saveNutritionProfile,
    addFoodEntry,
    addPlannedFoodEntry,
    updatePlannedFoodEntry,
    removeFoodEntry,
    applyCoachWorkoutChange,
    applyCoachGymPlan,
    applyCoachDietPlan,
    importDietPlanner,
    importGymPlanner,
    importWelcomePlan,
    importDefaultManualExercisePlan,
    togglePlannedMealComplete,
  };
}

export function GymStoreProvider({ children }: { children: ReactNode }) {
  const value = useGymStoreState();
  return (
    <GymStoreContext.Provider value={value}>{children}</GymStoreContext.Provider>
  );
}

export function useGymStore(): GymStoreValue {
  const context = useContext(GymStoreContext);
  if (!context) {
    throw new Error("useGymStore must be used within GymStoreProvider");
  }

  return context;
}
