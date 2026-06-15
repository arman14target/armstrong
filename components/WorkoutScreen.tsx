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
import { BatchExercisePreset } from "@/lib/workoutBatches";
import { consumeWorkoutSetupIntent } from "@/lib/workoutSetupIntent";
import {
  getWorkoutLabel,
  getWorkoutTemplate,
  isValidWorkoutId,
} from "@/lib/workouts";

interface WorkoutScreenProps {
  workoutId: string;
}

export function WorkoutScreen({ workoutId }: WorkoutScreenProps) {
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

  const workout = getWorkoutTemplate(data, workoutId);
  const session =
    data.activeSession?.workoutType === workoutId
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
      startSession(workoutId);
    }
  }, [hydrated, workoutId, startSession]);

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
    cancelSession(workoutId);
    router.push("/");
  }, [cancelSession, router, workoutId]);

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
    const completedSetCount = session?.completedSetIds.length ?? 0;

    if (completedSetCount === 0) {
      const confirmed = window.confirm(
        "No sets completed yet. Finish the day anyway?",
      );
      if (!confirmed) {
        return;
      }
    }

    cancelRestNotification();
    finishDay(workoutId);
    setShowLeaveModal(false);
    router.push("/");
  }, [finishDay, router, session?.completedSetIds.length, workoutId]);

  const handleCancelSessionAndLeave = useCallback(() => {
    cancelRestNotification();
    cancelSession(workoutId);
    setShowLeaveModal(false);
    router.push("/");
  }, [cancelSession, router, workoutId]);

  const label = getWorkoutLabel(data, workoutId);
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
      reps: number,
      restSeconds: number,
    ) => {
      cancelRestNotification();
      completeSet(workoutId, moveId, setId, weight, reps, restSeconds);
    },
    [completeSet, workoutId],
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

  if (!isValidWorkoutId(data, workoutId) || !workout) {
    return (
      <main className="page-shell--center stack-md text-center">
        <p className="text-sm text-magenta">Workout not found.</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm text-cyan transition-colors hover:text-magenta"
        >
          ← Back home
        </button>
      </main>
    );
  }

  const sessionWeights = session?.setWeights ?? {};
  const sessionReps = session?.setReps ?? {};
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
                sessionReps={sessionReps}
                completedSetIds={completedSetIds}
                activeRestSetId={session?.activeRestSetId}
                restEndsAt={session?.restEndsAt}
                onUpdateName={(name) =>
                  updateMoveName(workoutId, move.id, name)
                }
                onDelete={() => deleteMove(workoutId, move.id)}
                onAddSet={() => addSet(workoutId, move.id)}
                onUpdateSet={(setId, updates) =>
                  updateSet(workoutId, move.id, setId, updates)
                }
                onDeleteSet={(setId) => deleteSet(workoutId, move.id, setId)}
                onCompleteSet={(setId, weight, reps, restSeconds) =>
                  handleCompleteSet(move.id, setId, weight, reps, restSeconds)
                }
                onRestComplete={handleRestComplete}
                onAllSetsComplete={() => handleMoveAllSetsComplete(moveIndex)}
              />
            </div>
          ))
        )}
        <AddMoveForm onAdd={(name) => addMove(workoutId, name)} />
        <FinishDayButton
          onFinish={() => finishDay(workoutId)}
          hasCompletedSets={completedSetIds.length > 0}
        />
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

      <LeaveWorkoutModal
        open={showLeaveModal}
        label={label}
        completedSetCount={completedSetIds.length}
        onSave={handleSaveAndLeave}
        onCancelSession={handleCancelSessionAndLeave}
        onStay={() => setShowLeaveModal(false)}
      />
    </main>
  );
}
