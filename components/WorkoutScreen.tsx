"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AddMoveForm } from "@/components/AddMoveForm";
import { FinishDayButton } from "@/components/FinishDayButton";
import { LeaveWorkoutModal } from "@/components/LeaveWorkoutModal";
import { MoveCard } from "@/components/MoveCard";
import { RestNotificationBanner } from "@/components/RestNotificationBanner";
import { SessionTimer } from "@/components/SessionTimer";
import { WorkoutSetupModal } from "@/components/WorkoutSetupModal";
import { SectionHead } from "@/components/ui/SectionHead";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { useGymStore } from "@/hooks/useGymStore";
import {
  cancelRestNotification,
  notifyRestComplete,
  scheduleRestNotification,
} from "@/lib/restNotifications";
import { WORKOUT_LABELS, WorkoutType } from "@/lib/types";
import { BatchExercisePreset } from "@/lib/workoutBatches";

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
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    if (hydrated) {
      startSession(workoutType);
    }
  }, [hydrated, workoutType, startSession]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const isFirstVisit =
      workout.moves.length === 0 && !data.workoutSetupSeen?.[workoutType];
    setShowSetupModal(isFirstVisit);
  }, [hydrated, workout.moves.length, data.workoutSetupSeen, workoutType]);

  const handleImportPresets = useCallback(
    (exercises: BatchExercisePreset[]) => {
      importWorkoutPresets(workoutType, exercises);
      setShowSetupModal(false);
    },
    [importWorkoutPresets, workoutType],
  );

  const handleManualSetup = useCallback(() => {
    markWorkoutSetupSeen(workoutType);
    setShowSetupModal(false);
  }, [markWorkoutSetupSeen, workoutType]);

  const handleSetupCancel = useCallback(() => {
    cancelRestNotification();
    cancelSession(workoutType);
    router.push("/");
  }, [cancelSession, router, workoutType]);

  const handleLeaveRequest = useCallback(() => {
    if (showSetupModal) {
      handleSetupCancel();
      return;
    }
    if (session) {
      setShowLeaveModal(true);
      return;
    }
    router.push("/");
  }, [handleSetupCancel, router, session, showSetupModal]);

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

  const handleRestComplete = useCallback(() => {
    cancelRestNotification();
    if (session?.restEndsAt) {
      notifyRestComplete(session.restEndsAt, restNotificationBody);
    }
    clearRestTimer();
  }, [clearRestTimer, restNotificationBody, session?.restEndsAt]);

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
    if (!session || showSetupModal) {
      return;
    }

    window.history.pushState({ workoutLeaveGuard: true }, "");

    const handlePopState = () => {
      window.history.pushState({ workoutLeaveGuard: true }, "");
      setShowLeaveModal(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [session, showSetupModal]);

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
      <header className="sticky-header">
        <button
          type="button"
          onClick={handleLeaveRequest}
          className="mb-[var(--space-gap)] inline-flex min-h-11 items-center text-sm text-cyan transition-colors hover:text-magenta sm:min-h-12"
        >
          ← Back home
        </button>
        <div className="inline-gap-md w-full items-end justify-between">
          <h1 className="font-display text-2xl tracking-[2px] text-heading uppercase sm:text-3xl">
            {label}
          </h1>
          <SessionTimer startedAt={session?.startedAt} />
        </div>
      </header>

      <SectionHead index="02." title="Today's Exercises" />

      <RestNotificationBanner />

      <section className="stack-lg">
        {workout.moves.length === 0 ? (
          <TerminalWindow title={`${label} — exercises`}>
            <p className="text-dim">
              No exercises yet. Add your first one below.
            </p>
          </TerminalWindow>
        ) : (
          workout.moves.map((move) => (
            <MoveCard
              key={move.id}
              move={move}
              sessionWeights={sessionWeights}
              completedSetIds={completedSetIds}
              activeRestSetId={session?.activeRestSetId}
              restEndsAt={session?.restEndsAt}
              onUpdateName={(name) => updateMoveName(workoutType, move.id, name)}
              onDelete={() => deleteMove(workoutType, move.id)}
              onAddSet={() => addSet(workoutType, move.id)}
              onUpdateSet={(setId, updates) =>
                updateSet(workoutType, move.id, setId, updates)
              }
              onDeleteSet={(setId) => deleteSet(workoutType, move.id, setId)}
              onCompleteSet={(setId, weight, restSeconds) =>
                completeSet(workoutType, move.id, setId, weight, restSeconds)
              }
              onRestComplete={handleRestComplete}
            />
          ))
        )}
        <AddMoveForm onAdd={(name) => addMove(workoutType, name)} />
        <FinishDayButton
          onFinish={() => finishDay(workoutType)}
          hasCompletedSets={completedSetIds.length > 0}
        />
      </section>

      <WorkoutSetupModal
        open={showSetupModal}
        workoutType={workoutType}
        onImport={handleImportPresets}
        onManualSetup={handleManualSetup}
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
