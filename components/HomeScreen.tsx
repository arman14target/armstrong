"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RevealOnScroll } from "@/components/effects/RevealOnScroll";
import { DayButton } from "@/components/DayButton";
import { WorkoutEntryChoiceModal } from "@/components/WorkoutEntryChoiceModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { GlitchText } from "@/components/ui/GlitchText";
import { SectionHead } from "@/components/ui/SectionHead";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { useGymStore } from "@/hooks/useGymStore";
import { WORKOUT_LABELS, WORKOUT_TYPES, WorkoutType } from "@/lib/types";
import { setWorkoutSetupIntent } from "@/lib/workoutSetupIntent";

export function HomeScreen() {
  const router = useRouter();
  const { data, hydrated, resetAll } = useGymStore();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [entryChoiceType, setEntryChoiceType] = useState<WorkoutType | null>(null);

  const needsSetup = (type: WorkoutType) =>
    data.workouts[type].moves.length === 0 &&
    !data.workoutSetupSeen?.[type];

  const handleBatchEntry = () => {
    if (!entryChoiceType) {
      return;
    }

    setWorkoutSetupIntent(entryChoiceType, "batch");
    router.push(`/workout/${entryChoiceType}/`);
    setEntryChoiceType(null);
  };

  const handleManualEntry = () => {
    if (!entryChoiceType) {
      return;
    }

    setWorkoutSetupIntent(entryChoiceType, "manual");
    router.push(`/workout/${entryChoiceType}/`);
    setEntryChoiceType(null);
  };

  const completedCount = WORKOUT_TYPES.filter(
    (type) => data.workouts[type].lastCompletedAt,
  ).length;

  const handleResetConfirm = async () => {
    setResetting(true);
    try {
      await resetAll();
      window.location.reload();
    } catch {
      setResetting(false);
    }
  };

  if (!hydrated) {
    return (
      <main className="page-shell--center">
        <p className="animate-blink text-sm text-green">Loading your workouts...</p>
      </main>
    );
  }

  return (
    <main className="page-shell page-shell--home">
      <section className="hero-section mb-[var(--space-section)]">
        <div className="flex w-full items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <GlitchText
              text="ARMSTRONG"
              className="text-2xl tracking-[2px] sm:text-4xl lg:text-5xl"
            />
            <p className="mt-1 text-xs text-dim sm:text-sm">
              Train hard. Track everything.
            </p>
          </div>
          <ThemeToggle className="shrink-0" />
        </div>

        <div className="mt-2 grid w-full grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-cyber border border-line bg-bg/40 px-2 py-2 text-center sm:px-3">
            <p className="font-display text-lg text-heading sm:text-xl">
              {WORKOUT_TYPES.length}
              <span className="text-cyan">+</span>
            </p>
            <p className="mt-0.5 text-[10px] tracking-wide text-dim uppercase sm:text-[11px]">
              splits
            </p>
          </div>
          <div className="rounded-cyber border border-line bg-bg/40 px-2 py-2 text-center sm:px-3">
            <p className="font-display text-lg text-heading sm:text-xl">
              {completedCount}
              <span className="text-cyan">+</span>
            </p>
            <p className="mt-0.5 text-[10px] tracking-wide text-dim uppercase sm:text-[11px]">
              logged
            </p>
          </div>
          <div className="rounded-cyber border border-line bg-bg/40 px-2 py-2 text-center sm:px-3">
            <p className="font-display text-lg text-heading sm:text-xl">
              <span className="text-green">●</span> GO
            </p>
            <p className="mt-0.5 text-[10px] tracking-wide text-dim uppercase sm:text-[11px]">
              ready
            </p>
          </div>
        </div>
      </section>

      <RevealOnScroll>
        <SectionHead index="01." title="Pick Your Punishment" />
        <TerminalWindow title="Choose your workout">
          <div className="grid grid-cols-1 gap-[var(--space-gap-md)] sm:grid-cols-2">
            {WORKOUT_TYPES.map((type) => (
              <DayButton
                key={type}
                type={type}
                label={WORKOUT_LABELS[type]}
                lastCompletedAt={data.workouts[type].lastCompletedAt}
                lastSessionDurationSeconds={
                  data.workouts[type].lastSessionDurationSeconds
                }
                setupRequired={needsSetup(type)}
                onSetupClick={() => setEntryChoiceType(type)}
              />
            ))}
          </div>
        </TerminalWindow>
      </RevealOnScroll>

      <footer className="mt-[var(--space-section-lg)] stack-md text-center">
        <p className="text-xs tracking-wide text-dim">
          Built with <span className="text-magenta">♥</span> and protein shakes
          — Armstrong
        </p>
        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="text-sm font-medium tracking-wide text-red-400 transition-colors hover:text-red-300"
        >
          Reset app data
        </button>
      </footer>

      {entryChoiceType ? (
        <WorkoutEntryChoiceModal
          open
          workoutType={entryChoiceType}
          onBatch={handleBatchEntry}
          onManual={handleManualEntry}
          onClose={() => setEntryChoiceType(null)}
        />
      ) : null}

      <ConfirmModal
        open={showResetModal}
        title="Reset everything?"
        message={
          <>
            This will permanently delete all your workout history, exercises,
            weights, and active sessions. Stored app data, cookies, and cached
            files will also be cleared.
            <span className="mt-[var(--space-gap)] block font-semibold text-magenta">
              This action cannot be undone.
            </span>
          </>
        }
        confirmLabel="Yes, reset everything"
        cancelLabel="Keep my data"
        confirming={resetting}
        onConfirm={handleResetConfirm}
        onCancel={() => setShowResetModal(false)}
      />
    </main>
  );
}
