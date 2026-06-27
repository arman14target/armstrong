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
  detectSyncConflict,
  resolveSyncConflict,
  type SyncAuthMode,
  type SyncConflict,
  type SyncConflictStrategy,
} from "@/lib/userPlanSync";
import {
  BatchExercisePreset,
  createMoveFromPreset,
  getWorkoutBatch,
} from "@/lib/workoutBatches";
import { applySetDraft, shouldReuseActiveSession } from "@/lib/activeSession";
import {
  applyWorkoutTemplate,
  addCompletionDate,
  createCustomWorkoutDay,
  getWorkoutLabel,
  getWorkoutTemplate,
  isBuiltinWorkoutType,
  logWorkoutDayEntry,
  updateCustomWorkoutName,
  updateWorkoutMoves,
} from "@/lib/workouts";
import {
  buildSessionSnapshot,
  buildWorkoutShareSummary,
  type WorkoutShareSummary,
} from "@/lib/share/workoutShareSummary";
import type { WorkoutSessionSnapshot } from "@/lib/types";
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
import { createFoodEntry, createNutritionProfile, createPlannedFoodEntry, FoodEntry, NutritionProfile, nutritionProfileInputs, PlannedMealInput } from "@/lib/nutrition";
import { logWeight } from "@/lib/weight";
import { toLocalDateKey } from "@/lib/workoutCalendar";
import type { WeightUnit } from "@/lib/types";
import { changeAppLanguage } from "@/lib/i18n";
import type { AppLocale } from "@/lib/i18n/locales";
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
// Prevents the auth auto-effect and an explicit post-auth sync from both
// kicking off a sync (and a duplicate conflict prompt) for the same login.
let syncInFlight = false;

function useGymStoreState() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(createDefaultAppData);
  const [hydrated, setHydrated] = useState(false);
  // Transient: the just-finished workout, surfaced as a share prompt on home.
  // Not persisted — cleared once the user shares or dismisses.
  const [lastFinishedSummary, setLastFinishedSummary] =
    useState<WorkoutShareSummary | null>(null);
  const clearFinishedSummary = useCallback(
    () => setLastFinishedSummary(null),
    [],
  );

  useEffect(() => {
    setData(loadAppData());
    setHydrated(true);
  }, []);

  useEffect(() => {
    setCloudSyncUserId(user?.id ?? null);
  }, [user?.id]);

  const [syncConflict, setSyncConflict] = useState<SyncConflict | null>(null);

  // Commit a resolved plan into state, but never clobber an in-progress
  // workout that lives only on this device.
  const commitSyncedData = useCallback((synced: AppData) => {
    setData((prev) => {
      const localSession = prev.activeSession ?? loadAppData().activeSession;
      if (!localSession || synced.activeSession === localSession) {
        return synced;
      }

      const merged = { ...synced, activeSession: localSession };
      saveAppData(merged);
      return merged;
    });
  }, []);

  const syncForUser = useCallback(
    async (userId: string, _mode: SyncAuthMode = "sign-in") => {
      if (syncInFlight) {
        return;
      }
      syncInFlight = true;
      try {
        const result = await detectSyncConflict(userId);
        if (result.kind === "conflict") {
          // Wait for the user's choice; mark synced so the auth effect won't refire.
          setSyncConflict(result.conflict);
          syncedUserId = userId;
          return;
        }

        commitSyncedData(result.appData);
        clearLocalOnlyChanges();
        syncedUserId = userId;
      } finally {
        syncInFlight = false;
      }
    },
    [commitSyncedData],
  );

  const resolveDataConflict = useCallback(
    async (strategy: SyncConflictStrategy) => {
      if (!syncConflict) {
        return;
      }
      const appData = await resolveSyncConflict(syncConflict, strategy);
      commitSyncedData(appData);
      clearLocalOnlyChanges();
      setSyncConflict(null);
    },
    [syncConflict, commitSyncedData],
  );

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
      return next;
    });
    scheduleCloudSync();
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
      persist((prev) => {
        const session = prev.activeSession;
        let activeSession = session;

        if (
          session?.workoutType === workoutId &&
          session.activeRestSetId === setId &&
          updates.restSeconds !== undefined &&
          session.restEndsAt
        ) {
          const template = getWorkoutTemplate(prev, workoutId);
          const move = template?.moves.find((entry) => entry.id === moveId);
          const set = move?.sets.find((entry) => entry.id === setId);
          const oldRestSeconds = set?.restSeconds ?? 0;
          const delta = updates.restSeconds - oldRestSeconds;
          const newEndsAtMs =
            new Date(session.restEndsAt).getTime() + delta * 1000;

          if (updates.restSeconds <= 0 || newEndsAtMs <= Date.now()) {
            activeSession = {
              ...session,
              activeRestSetId: undefined,
              restEndsAt: undefined,
            };
          } else {
            activeSession = {
              ...session,
              restEndsAt: new Date(newEndsAtMs).toISOString(),
            };
          }
        }

        return {
          ...updateWorkoutMoves(prev, workoutId, (moves) =>
            moves.map((move) =>
              move.id === moveId
                ? {
                    ...move,
                    sets: move.sets.map((set) => {
                      if (set.id !== setId) {
                        return set;
                      }

                      const next = { ...set, ...updates };
                      if (updates.lastWeight === undefined) {
                        delete next.lastWeight;
                      }
                      if (updates.lastReps === undefined) {
                        delete next.lastReps;
                      }
                      return next;
                    }),
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

  // Persist in-progress (typed-but-not-completed) set values so a half-logged
  // workout survives the app closing. Completion stays keyed by completedSetIds,
  // so storing a draft weight/reps here does not mark the set complete.
  const updateSetDraft = useCallback(
    (workoutId: string, setId: string, weight?: number, reps?: number) => {
      if (weight === undefined && reps === undefined) {
        return;
      }
      persist((prev) => {
        const session = prev.activeSession;
        if (!session) {
          return prev;
        }
        const nextSession = applySetDraft(
          session,
          workoutId,
          setId,
          weight,
          reps,
        );
        if (nextSession === session) {
          return prev;
        }
        return { ...prev, activeSession: nextSession };
      });
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
      const completedAt = new Date().toISOString();

      // Build the share summary from the live session before persist clears it.
      // Only when at least one set was completed — nothing worth sharing else.
      const finishingSession = data.activeSession;
      const finishingTemplate = getWorkoutTemplate(data, workoutId);
      let sessionSnapshot: WorkoutSessionSnapshot | undefined;
      if (
        finishingSession &&
        finishingTemplate &&
        finishingSession.completedSetIds.length > 0
      ) {
        sessionSnapshot = buildSessionSnapshot(
          finishingTemplate.moves,
          finishingSession,
        );
        setLastFinishedSummary(
          buildWorkoutShareSummary({
            workoutName: getWorkoutLabel(data, workoutId),
            moves: finishingTemplate.moves,
            session: finishingSession,
            completedAt,
            completionDates: data.workoutCompletionDates,
          }),
        );
      } else {
        setLastFinishedSummary(null);
      }

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
            ...(sessionSnapshot ? { snapshot: sessionSnapshot } : {}),
          }),
          activeSession: null,
        };
      });
    },
    [data, persist],
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
      // Saving a plan also records the entered weight, so the body-weight chart
      // starts tracking from setup ("manual + on plan edit").
      persist((prev) => ({
        ...prev,
        nutritionProfile: profile,
        targetWeightKg: profile.targetWeightKg,
        weightBaselineKg: prev.weightBaselineKg ?? profile.weightKg,
        weightLog: logWeight(
          prev.weightLog,
          profile.weightKg,
          toLocalDateKey(new Date()),
        ),
      }));
    },
    [persist],
  );

  // Record a body-weight measurement (one per day) and, if a nutrition profile
  // exists, recompute the plan's targets against the new weight so calories and
  // macros track the user's progress.
  const logBodyWeight = useCallback(
    (weightKg: number) => {
      if (!Number.isFinite(weightKg) || weightKg <= 0) {
        return;
      }
      persist((prev) => {
        const today = toLocalDateKey(new Date());
        const prevLog = prev.weightLog ?? [];
        const todayEntry = prevLog.find((entry) => entry.date === today);

        let weightBaselineKg = prev.weightBaselineKg;
        if (!weightBaselineKg) {
          if (todayEntry) {
            weightBaselineKg = todayEntry.weightKg;
          } else if (prevLog.length > 0) {
            weightBaselineKg = prevLog[0].weightKg;
          } else {
            weightBaselineKg = weightKg;
          }
        }

        const weightLog = logWeight(prevLog, weightKg, today);
        const nutritionProfile = prev.nutritionProfile
          ? createNutritionProfile({
              ...nutritionProfileInputs(prev.nutritionProfile, prev.targetWeightKg),
              weightKg,
            })
          : prev.nutritionProfile;
        return { ...prev, weightLog, weightBaselineKg, nutritionProfile };
      });
    },
    [persist],
  );

  const setTargetWeight = useCallback(
    (targetWeightKg: number | null) => {
      persist((prev) => {
        if (!targetWeightKg || targetWeightKg <= 0) {
          const next = { ...prev };
          delete next.targetWeightKg;
          return next;
        }

        const nutritionProfile = prev.nutritionProfile
          ? createNutritionProfile({
              ...nutritionProfileInputs(prev.nutritionProfile, prev.targetWeightKg),
              targetWeightKg,
            })
          : prev.nutritionProfile;

        return { ...prev, targetWeightKg, nutritionProfile };
      });
    },
    [persist],
  );

  const setWeightUnit = useCallback(
    (weightUnit: WeightUnit) => {
      persist((prev) => ({ ...prev, weightUnit }));
    },
    [persist],
  );

  const setAdvancedNutrition = useCallback(
    (advancedNutrition: boolean) => {
      persist((prev) => ({ ...prev, advancedNutrition }));
    },
    [persist],
  );

  const setLocale = useCallback(
    (locale: AppLocale) => {
      void changeAppLanguage(locale);
      persist((prev) => ({ ...prev, locale }));
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
    updateSetDraft,
    completeSet,
    uncompleteSet,
    reorderMoves,
    clearRestTimer,
    clearSession,
    cancelSession,
    finishDay,
    lastFinishedSummary,
    clearFinishedSummary,
    addCustomDay,
    removeCustomDay,
    renameCustomDay,
    getWorkout,
    getSession,
    resetAll,
    syncAfterAuth,
    syncConflict,
    resolveDataConflict,
    saveNutritionProfile,
    logBodyWeight,
    setTargetWeight,
    setWeightUnit,
    setAdvancedNutrition,
    setLocale,
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
