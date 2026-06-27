"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AddMoveForm } from "@/components/AddMoveForm";
import { ExerciseReorderList } from "@/components/ExerciseReorderList";
import {
  CancelWorkoutButton,
  FinishWorkoutButton,
} from "@/components/FinishDayButton";
import { RestNotificationBanner } from "@/components/RestNotificationBanner";
import { SessionTimer } from "@/components/SessionTimer";
import { WorkoutEntryChoiceModal } from "@/components/WorkoutEntryChoiceModal";
import { WorkoutSetupModal } from "@/components/WorkoutSetupModal";
import type { WorkoutSheetMode } from "@/components/WorkoutBottomSheet";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { CyberButton } from "@/components/ui/CyberButton";
import { useGymStore } from "@/hooks/useGymStore";
import {
  cancelRestNotification,
  notifyRestComplete,
  scheduleRestNotification,
} from "@/lib/restNotifications";
import { shouldReuseActiveSession } from "@/lib/activeSession";
import { BatchExercisePreset } from "@/lib/workoutBatches";
import { consumeWorkoutSetupIntent } from "@/lib/workoutSetupIntent";
import {
  getWorkoutLabel,
  getWorkoutTemplate,
  isBuiltinWorkoutType,
  isValidWorkoutId,
} from "@/lib/workouts";
import { cn } from "@/lib/cn";

interface WorkoutScreenProps {
  workoutId: string;
  mode?: WorkoutSheetMode;
  embedded?: boolean;
  onClose?: () => void;
}

export function WorkoutScreen({
  workoutId,
  mode = "session",
  embedded = false,
  onClose,
}: WorkoutScreenProps) {
  const { t } = useTranslation();
  const {
    data,
    hydrated,
    startSession,
    addMove,
    importWorkoutPresets,
    markWorkoutSetupSeen,
    renameCustomDay,
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
    cancelSession,
    finishDay,
  } = useGymStore();

  const workout = getWorkoutTemplate(data, workoutId);
  const isLayoutMode = mode === "layout";
  const layoutSetValues = useMemo(() => {
    if (!workout) {
      return { weights: {}, reps: {}, completed: [] as string[] };
    }

    const weights: Record<string, number> = {};
    const reps: Record<string, number> = {};
    const completed: string[] = [];

    for (const move of workout.moves) {
      for (const set of move.sets) {
        if (set.lastWeight !== undefined) {
          weights[set.id] = set.lastWeight;
        }
        if (set.lastReps !== undefined) {
          reps[set.id] = set.lastReps;
        }
        if (set.lastWeight !== undefined && set.lastReps !== undefined) {
          completed.push(set.id);
        }
      }
    }

    return { weights, reps, completed };
  }, [workout]);
  const session =
    mode === "session" && data.activeSession?.workoutType === workoutId
      ? data.activeSession
      : null;
  const [showEntryChoice, setShowEntryChoice] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [headerStuck, setHeaderStuck] = useState(false);
  const [headerBarHeight, setHeaderBarHeight] = useState(0);
  const headerSentinelRef = useRef<HTMLDivElement>(null);
  const headerBarRef = useRef<HTMLDivElement>(null);
  const moveRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [setupIntentHandled, setSetupIntentHandled] = useState(false);
  const [editingDayName, setEditingDayName] = useState(false);
  const [dayNameDraft, setDayNameDraft] = useState("");

  useEffect(() => {
    if (!hydrated || mode !== "session") {
      return;
    }

    if (
      !shouldReuseActiveSession(
        data.activeSession,
        workoutId,
        getWorkoutTemplate(data, workoutId),
      )
    ) {
      startSession(workoutId);
    }
  }, [hydrated, workoutId, data, startSession, mode]);

  useEffect(() => {
    const sentinel = headerSentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setHeaderStuck(!entry.isIntersecting),
      { threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hydrated]);

  useEffect(() => {
    const bar = headerBarRef.current;
    if (!bar) {
      return;
    }

    const updateHeight = () => setHeaderBarHeight(bar.offsetHeight);

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [hydrated, workoutId]);

  useEffect(() => {
    if (!hydrated || setupIntentHandled) {
      return;
    }

    if (!workout) {
      setSetupIntentHandled(true);
      return;
    }

    const isFirstVisit =
      workout.moves.length === 0 && !data.workoutSetupSeen?.[workoutId];

    if (!isFirstVisit) {
      setShowSetupModal(false);
      setShowEntryChoice(false);
      setSetupIntentHandled(true);
      return;
    }

    const setupMode = consumeWorkoutSetupIntent(workoutId);

    if (setupMode === "batch") {
      setShowSetupModal(true);
      setShowEntryChoice(false);
    } else if (setupMode === "manual") {
      markWorkoutSetupSeen(workoutId);
      setShowSetupModal(false);
      setShowEntryChoice(false);
    } else {
      setShowEntryChoice(true);
      setShowSetupModal(false);
    }

    setSetupIntentHandled(true);
  }, [
    hydrated,
    setupIntentHandled,
    workout?.moves.length,
    data.workoutSetupSeen,
    workoutId,
    markWorkoutSetupSeen,
    workout,
  ]);

  const handleImportPresets = useCallback(
    (exercises: BatchExercisePreset[]) => {
      importWorkoutPresets(workoutId, exercises);
      setShowSetupModal(false);
    },
    [importWorkoutPresets, workoutId],
  );

  const handleEntryBatch = useCallback(() => {
    setShowEntryChoice(false);
    setShowSetupModal(true);
  }, []);

  const handleEntryManual = useCallback(() => {
    markWorkoutSetupSeen(workoutId);
    setShowEntryChoice(false);
  }, [markWorkoutSetupSeen, workoutId]);

  const handleSetupCancel = useCallback(() => {
    cancelRestNotification();
    if (mode === "session") {
      cancelSession(workoutId);
    }
    onClose?.();
  }, [cancelSession, mode, onClose, workoutId]);

  const handleFinishWorkout = useCallback(() => {
    cancelRestNotification();
    finishDay(workoutId);
    onClose?.();
  }, [finishDay, onClose, workoutId]);

  const handleCancelWorkout = useCallback(() => {
    cancelRestNotification();
    cancelSession(workoutId);
    onClose?.();
  }, [cancelSession, onClose, workoutId]);

  const label = getWorkoutLabel(data, workoutId);
  const isCustomDay = !isBuiltinWorkoutType(workoutId);
  const restNotificationBody = t("workout.restNotificationBody", { label });

  useEffect(() => {
    if (!editingDayName) {
      setDayNameDraft(label);
    }
  }, [editingDayName, label]);

  const commitDayName = useCallback(() => {
    const trimmed = dayNameDraft.trim();
    if (trimmed && isCustomDay) {
      renameCustomDay(workoutId, trimmed);
    }
    setEditingDayName(false);
  }, [dayNameDraft, isCustomDay, renameCustomDay, workoutId]);

  const handleRestComplete = useCallback(
    (setId: string) => {
      if (session?.activeRestSetId !== setId) {
        return;
      }

      cancelRestNotification();
      if (session.restEndsAt) {
        notifyRestComplete(session.restEndsAt, restNotificationBody);
      }
      clearRestTimer();
    },
    [
      clearRestTimer,
      restNotificationBody,
      session?.activeRestSetId,
      session?.restEndsAt,
    ],
  );

  const handleCompleteSet = useCallback(
    (
      moveId: string,
      setId: string,
      weight: number,
      reps: number,
      restSeconds: number,
    ) => {
      cancelRestNotification();
      completeSet(workoutId, moveId, setId, weight, reps, restSeconds);
    },
    [completeSet, workoutId],
  );

  const handleLayoutSaveSet = useCallback(
    (moveId: string, setId: string, weight: number, reps: number) => {
      updateSet(workoutId, moveId, setId, { lastWeight: weight, lastReps: reps });
    },
    [updateSet, workoutId],
  );

  const handleLayoutDraftSet = useCallback(
    (moveId: string, setId: string, weight?: number, reps?: number) => {
      const updates: { lastWeight?: number; lastReps?: number } = {};
      if (weight !== undefined) {
        updates.lastWeight = weight;
      }
      if (reps !== undefined) {
        updates.lastReps = reps;
      }
      if (Object.keys(updates).length > 0) {
        updateSet(workoutId, moveId, setId, updates);
      }
    },
    [updateSet, workoutId],
  );

  const handleLayoutUncompleteSet = useCallback(
    (moveId: string, setId: string) => {
      updateSet(workoutId, moveId, setId, {
        lastWeight: undefined,
        lastReps: undefined,
      });
    },
    [updateSet, workoutId],
  );

  const handleMoveAllSetsComplete = useCallback(
    (moveIndex: number) => {
      const nextMove = workout?.moves[moveIndex + 1];
      if (!nextMove) {
        return;
      }

      window.setTimeout(() => {
        moveRefs.current.get(nextMove.id)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 320);
    },
    [workout?.moves],
  );

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (session?.restEndsAt) {
      scheduleRestNotification(session.restEndsAt, restNotificationBody);
      return () => cancelRestNotification();
    }

    cancelRestNotification();
  }, [hydrated, session?.restEndsAt, restNotificationBody]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <p className="animate-blink text-sm text-green">{t("workout.loading")}</p>
      </div>
    );
  }

  if (!isValidWorkoutId(data, workoutId) || !workout) {
    return (
      <div className="stack-md py-8 text-center">
        <p className="text-sm text-magenta">{t("workout.notFound")}</p>
      </div>
    );
  }

  const sessionWeights = isLayoutMode
    ? layoutSetValues.weights
    : (session?.setWeights ?? {});
  const sessionReps = isLayoutMode
    ? layoutSetValues.reps
    : (session?.setReps ?? {});
  const completedSetIds = isLayoutMode
    ? layoutSetValues.completed
    : (session?.completedSetIds ?? []);
  const showSessionActions = mode === "session";

  return (
    <div className={cn(embedded ? "workout-screen--embedded" : "page-shell")}>
      <div className="mb-2 flex items-center justify-end gap-2">
        {isLayoutMode && !headerStuck ? (
          <CyberButton
            variant="green"
            className="min-h-9 shrink-0 border-green bg-green/15 px-3 text-xs"
            onClick={() => onClose?.()}
          >
            {t("workout.layoutDone")}
          </CyberButton>
        ) : !isLayoutMode && !headerStuck ? (
          <FinishWorkoutButton
            onFinish={handleFinishWorkout}
            hasCompletedSets={completedSetIds.length > 0}
          />
        ) : null}
      </div>
      <div ref={headerSentinelRef} className="h-px" aria-hidden />
      {headerStuck ? (
        <div
          aria-hidden
          className="workout-sticky-bar-spacer"
          style={{ height: headerBarHeight }}
        />
      ) : null}
      <div
        ref={headerBarRef}
        className={`workout-sticky-bar${headerStuck ? " workout-sticky-bar--stuck" : ""}${embedded ? " workout-sticky-bar--embedded" : ""}`}
      >
        <div className="workout-sticky-bar__inner">
          {editingDayName && isCustomDay ? (
            <input
              value={dayNameDraft}
              onChange={(event) => setDayNameDraft(event.target.value)}
              onBlur={commitDayName}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitDayName();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setDayNameDraft(label);
                  setEditingDayName(false);
                }
              }}
              aria-label={t("workout.dayNameAria")}
              className="workout-sticky-bar__label min-w-0 flex-1 truncate rounded border border-cyan/35 bg-bg/80 px-2 py-1 font-display text-sm tracking-[1px] text-heading uppercase outline-none focus:border-cyan"
              autoFocus
            />
          ) : isCustomDay ? (
            <button
              type="button"
              onClick={() => {
                setDayNameDraft(label);
                setEditingDayName(true);
              }}
              className="workout-sticky-bar__label min-w-0 flex-1 truncate text-left font-display text-sm tracking-[1px] text-heading uppercase transition-colors hover:text-cyan"
            >
              {label}
            </button>
          ) : (
            <h1 className="workout-sticky-bar__label truncate font-display text-sm tracking-[1px] text-heading uppercase">
              {label}
            </h1>
          )}
          {showSessionActions ? (
            <div className="workout-sticky-bar__timer">
              <SessionTimer startedAt={session?.startedAt} compact />
            </div>
          ) : null}
          {headerStuck && showSessionActions ? (
            <div className="workout-sticky-bar__finish">
              <FinishWorkoutButton
                compact
                onFinish={handleFinishWorkout}
                hasCompletedSets={completedSetIds.length > 0}
              />
            </div>
          ) : null}
          {headerStuck && isLayoutMode ? (
            <div className="workout-sticky-bar__finish">
              <CyberButton
                variant="green"
                className="min-h-8 shrink-0 border-green bg-green/15 px-3 text-xs"
                onClick={() => onClose?.()}
              >
                {t("workout.layoutDone")}
              </CyberButton>
            </div>
          ) : null}
        </div>
      </div>

      <RestNotificationBanner
        key={workoutId}
        active={Boolean(session) && !showSetupModal && !showEntryChoice}
        onPermissionGranted={() => {
          if (session?.restEndsAt) {
            scheduleRestNotification(session.restEndsAt, restNotificationBody);
          }
        }}
      />

      <section className="stack-lg">
        {workout.moves.length === 0 ? (
          <TerminalWindow title={t("workout.exercisesTitle", { name: label })}>
            <p className="text-dim">{t("workout.noMovesHint")}</p>
          </TerminalWindow>
        ) : (
          <ExerciseReorderList
            moves={workout.moves}
            sessionWeights={sessionWeights}
            sessionReps={sessionReps}
            completedSetIds={completedSetIds}
            activeRestSetId={session?.activeRestSetId}
            restEndsAt={session?.restEndsAt}
            moveRefs={moveRefs}
            onUpdateName={(moveId, name) =>
              updateMoveName(workoutId, moveId, name)
            }
            onDelete={(moveId) => deleteMove(workoutId, moveId)}
            onAddSet={(moveId) => addSet(workoutId, moveId)}
            onUpdateSet={(moveId, setId, updates) =>
              updateSet(workoutId, moveId, setId, updates)
            }
            onDraftSet={
              isLayoutMode
                ? (moveId, setId, weight, reps) =>
                    handleLayoutDraftSet(moveId, setId, weight, reps)
                : (moveId, setId, weight, reps) =>
                    updateSetDraft(workoutId, setId, weight, reps)
            }
            onCompleteSet={
              isLayoutMode
                ? (moveId, setId, weight, reps) =>
                    handleLayoutSaveSet(moveId, setId, weight, reps)
                : (moveId, setId, weight, reps, restSeconds) =>
                    handleCompleteSet(moveId, setId, weight, reps, restSeconds)
            }
            onUncompleteSet={(moveId, setId) => {
              if (isLayoutMode) {
                handleLayoutUncompleteSet(moveId, setId);
                return;
              }

              cancelRestNotification();
              uncompleteSet(workoutId, moveId, setId);
            }}
            onDeleteSet={(moveId, setId) =>
              deleteSet(workoutId, moveId, setId)
            }
            onRestComplete={handleRestComplete}
            onAllSetsComplete={handleMoveAllSetsComplete}
            onReorder={(fromIndex, toIndex) =>
              reorderMoves(workoutId, fromIndex, toIndex)
            }
          />
        )}
        <AddMoveForm onAdd={(name) => addMove(workoutId, name)} />
        {showSessionActions ? (
          <CancelWorkoutButton
            onCancel={handleCancelWorkout}
            hasCompletedSets={completedSetIds.length > 0}
          />
        ) : null}
      </section>

      <WorkoutEntryChoiceModal
        open={showEntryChoice}
        label={label}
        onBatch={handleEntryBatch}
        onManual={handleEntryManual}
        onClose={handleSetupCancel}
      />

      <WorkoutSetupModal
        open={showSetupModal}
        workoutId={workoutId}
        label={label}
        onImport={handleImportPresets}
        onCancel={handleSetupCancel}
      />
    </div>
  );
}
