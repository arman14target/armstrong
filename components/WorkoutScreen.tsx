"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AddMoveForm } from "@/components/AddMoveForm";
import { FinishDayButton } from "@/components/FinishDayButton";
import { LeaveWorkoutModal } from "@/components/LeaveWorkoutModal";
import { MoveCard } from "@/components/MoveCard";
import { RestNotificationBanner } from "@/components/RestNotificationBanner";
import { SessionTimer } from "@/components/SessionTimer";
import { WorkoutEntryChoiceModal } from "@/components/WorkoutEntryChoiceModal";
import { WorkoutSetupModal } from "@/components/WorkoutSetupModal";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { useGymStore } from "@/hooks/useGymStore";
import {
  cancelRestNotification,
  notifyRestComplete,
  scheduleRestNotification,
} from "@/lib/restNotifications";
import { WORKOUT_LABELS, WorkoutType } from "@/lib/types";
import { BatchExercisePreset } from "@/lib/workoutBatches";
import { consumeWorkoutSetupIntent } from "@/lib/workoutSetupIntent";

interface WorkoutScreenProps {
  workoutType: WorkoutType;
}

export function WorkoutScreen({ workoutType }: WorkoutScreenProps) {
  const router = useRouter();
  const {
    data,
    hydrated,
    startSession,
    addMove,
    importWorkoutPresets,
    markWorkoutSetupSeen,
    updateMoveName,
    deleteMove,
    addSet,
    deleteSet,
    updateSet,
    completeSet,
    clearRestTimer,
    cancelSession,
    finishDay,
  } = useGymStore();

  const workout = data.workouts[workoutType];
  const session =
    data.activeSession?.workoutType === workoutType
      ? data.activeSession
      : null;
  const [showEntryChoice, setShowEntryChoice] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [headerStuck, setHeaderStuck] = useState(false);
  const [headerBarHeight, setHeaderBarHeight] = useState(0);
  const headerSentinelRef = useRef<HTMLDivElement>(null);
  const headerBarRef = useRef<HTMLDivElement>(null);
  const moveRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [setupIntentHandled, setSetupIntentHandled] = useState(false);

  useEffect(() => {
    if (hydrated) {
      startSession(workoutType);
    }
  }, [hydrated, workoutType, startSession]);

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
  }, [hydrated, workoutType]);

  useEffect(() => {
    if (!hydrated || setupIntentHandled) {
      return;
    }

    const isFirstVisit =
      workout.moves.length === 0 && !data.workoutSetupSeen?.[workoutType];

    if (!isFirstVisit) {
      setShowSetupModal(false);
      setShowEntryChoice(false);
      setSetupIntentHandled(true);
      return;
    }

    const setupMode = consumeWorkoutSetupIntent(workoutType);

    if (setupMode === "batch") {
      setShowSetupModal(true);
      setShowEntryChoice(false);
    } else if (setupMode === "manual") {
      markWorkoutSetupSeen(workoutType);
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
    workout.moves.length,
    data.workoutSetupSeen,
    workoutType,
    markWorkoutSetupSeen,
  ]);

  const handleImportPresets = useCallback(
    (exercises: BatchExercisePreset[]) => {
      importWorkoutPresets(workoutType, exercises);
      setShowSetupModal(false);
    },
    [importWorkoutPresets, workoutType],
  );

  const handleEntryBatch = useCallback(() => {
    setShowEntryChoice(false);
    setShowSetupModal(true);
  }, []);

  const handleEntryManual = useCallback(() => {
    markWorkoutSetupSeen(workoutType);
    setShowEntryChoice(false);
  }, [markWorkoutSetupSeen, workoutType]);

  const handleSetupCancel = useCallback(() => {
    cancelRestNotification();
    cancelSession(workoutType);
    router.push("/");
  }, [cancelSession, router, workoutType]);

  const handleLeaveRequest = useCallback(() => {
    if (showSetupModal || showEntryChoice) {
      handleSetupCancel();
      return;
    }
    if (session) {
      setShowLeaveModal(true);
      return;
    }
    router.push("/");
  }, [handleSetupCancel, router, session, showEntryChoice, showSetupModal]);

  const handleSaveAndLeave = useCallback(() => {
    cancelRestNotification();
    clearRestTimer();
    setShowLeaveModal(false);
    router.push("/");
  }, [clearRestTimer, router]);

  const handleCancelSessionAndLeave = useCallback(() => {
    cancelRestNotification();
    cancelSession(workoutType);
    setShowLeaveModal(false);
    router.push("/");
  }, [cancelSession, router, workoutType]);

  const label = WORKOUT_LABELS[workoutType];
  const restNotificationBody = `${label} — time for your next set`;

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
      restSeconds: number,
    ) => {
      cancelRestNotification();
      completeSet(workoutType, moveId, setId, weight, restSeconds);
    },
    [cancelRestNotification, completeSet, workoutType],
  );

  const handleMoveAllSetsComplete = useCallback(
    (moveIndex: number) => {
      const nextMove = workout.moves[moveIndex + 1];
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
    [workout.moves],
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

  useEffect(() => {
    if (!session || showSetupModal || showEntryChoice) {
      return;
    }

    window.history.pushState({ workoutLeaveGuard: true }, "");

    const handlePopState = () => {
      window.history.pushState({ workoutLeaveGuard: true }, "");
      setShowLeaveModal(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [session, showEntryChoice, showSetupModal]);

  if (!hydrated) {
    return (
      <main className="page-shell--center">
        <p className="animate-blink text-sm text-green">Loading workout...</p>
      </main>
    );
  }

  const sessionWeights = session?.setWeights ?? {};
  const completedSetIds = session?.completedSetIds ?? [];

  return (
    <main className="page-shell">
      <button
        type="button"
        onClick={handleLeaveRequest}
        className="mb-2 inline-flex min-h-9 items-center text-xs text-cyan transition-colors hover:text-magenta"
      >
        ← Back home
      </button>
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
        className={`workout-sticky-bar${headerStuck ? " workout-sticky-bar--stuck" : ""}`}
      >
        <div className="workout-sticky-bar__inner">
          <h1 className="min-w-0 truncate font-display text-sm tracking-[1px] text-heading uppercase">
            {label}
          </h1>
          <SessionTimer startedAt={session?.startedAt} compact />
        </div>
      </div>

      <RestNotificationBanner />

      <section className="stack-lg">
        {workout.moves.length === 0 ? (
          <TerminalWindow title={`${label} — exercises`}>
            <p className="text-dim">
              No exercises yet. Add your first one below.
            </p>
          </TerminalWindow>
        ) : (
          workout.moves.map((move, moveIndex) => (
            <div
              key={move.id}
              ref={(element) => {
                if (element) {
                  moveRefs.current.set(move.id, element);
                } else {
                  moveRefs.current.delete(move.id);
                }
              }}
              className="scroll-mt-20"
            >
              <MoveCard
                move={move}
                sessionWeights={sessionWeights}
                completedSetIds={completedSetIds}
                activeRestSetId={session?.activeRestSetId}
                restEndsAt={session?.restEndsAt}
                onUpdateName={(name) =>
                  updateMoveName(workoutType, move.id, name)
                }
                onDelete={() => deleteMove(workoutType, move.id)}
                onAddSet={() => addSet(workoutType, move.id)}
                onUpdateSet={(setId, updates) =>
                  updateSet(workoutType, move.id, setId, updates)
                }
                onDeleteSet={(setId) => deleteSet(workoutType, move.id, setId)}
                onCompleteSet={(setId, weight, restSeconds) =>
                  handleCompleteSet(move.id, setId, weight, restSeconds)
                }
                onRestComplete={handleRestComplete}
                onAllSetsComplete={() => handleMoveAllSetsComplete(moveIndex)}
              />
            </div>
          ))
        )}
        <AddMoveForm onAdd={(name) => addMove(workoutType, name)} />
        <FinishDayButton
          onFinish={() => finishDay(workoutType)}
          hasCompletedSets={completedSetIds.length > 0}
        />
      </section>

      <WorkoutEntryChoiceModal
        open={showEntryChoice}
        workoutType={workoutType}
        onBatch={handleEntryBatch}
        onManual={handleEntryManual}
        onClose={handleSetupCancel}
      />

      <WorkoutSetupModal
        open={showSetupModal}
        workoutType={workoutType}
        onImport={handleImportPresets}
        onCancel={handleSetupCancel}
      />

      <LeaveWorkoutModal
        open={showLeaveModal}
        workoutType={workoutType}
        completedSetCount={completedSetIds.length}
        onSave={handleSaveAndLeave}
        onCancelSession={handleCancelSessionAndLeave}
        onStay={() => setShowLeaveModal(false)}
      />
    </main>
  );
}
