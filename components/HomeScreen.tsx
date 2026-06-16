"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddDayButton } from "@/components/AddDayButton";
import { AddDayModal } from "@/components/AddDayModal";
import { RevealOnScroll } from "@/components/effects/RevealOnScroll";
import { DayButton } from "@/components/DayButton";
import { WorkoutEntryChoiceModal } from "@/components/WorkoutEntryChoiceModal";
import { WorkoutMonthCalendar } from "@/components/WorkoutMonthCalendar";
import { CoachChatSection } from "@/components/CoachChatSection";
import {
  CalendarIcon,
  CoachIcon,
  DumbbellIcon,
  FoodIcon,
} from "@/components/icons/ActionIcons";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FoodTrackerSection } from "@/components/FoodTrackerSection";
import { GlitchText } from "@/components/ui/GlitchText";
import { SectionHead } from "@/components/ui/SectionHead";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { useGymStore } from "@/hooks/useGymStore";
import { cn } from "@/lib/cn";
import { WORKOUT_LABELS, WORKOUT_TYPES } from "@/lib/types";
import {
  countLoggedWorkouts,
  getWorkoutLabel,
  getWorkoutTemplate,
} from "@/lib/workouts";
import { setWorkoutSetupIntent } from "@/lib/workoutSetupIntent";

type HomeTab = "punishment" | "calendar" | "food-tracker" | "coach";

const homeTabs: Array<{
  id: HomeTab;
  label: string;
  icon: typeof DumbbellIcon;
}> = [
  { id: "punishment", label: "Punishment", icon: DumbbellIcon },
  { id: "calendar", label: "Calendar", icon: CalendarIcon },
  { id: "food-tracker", label: "Food tracker", icon: FoodIcon },
  { id: "coach", label: "Coach", icon: CoachIcon },
];

export function HomeScreen() {
  const router = useRouter();
  const { data, hydrated, resetAll, addCustomDay, removeCustomDay, saveNutritionProfile } =
    useGymStore();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeTab, setActiveTab] = useState<HomeTab>("punishment");
  const [entryChoiceId, setEntryChoiceId] = useState<string | null>(null);
  const [removeDayId, setRemoveDayId] = useState<string | null>(null);

  const needsSetup = (workoutId: string) => {
    const template = getWorkoutTemplate(data, workoutId);
    return (
      (template?.moves.length ?? 0) === 0 && !data.workoutSetupSeen?.[workoutId]
    );
  };

  const handleBatchEntry = () => {
    if (!entryChoiceId) {
      return;
    }

    setWorkoutSetupIntent(entryChoiceId, "batch");
    router.push(`/workout/?type=${entryChoiceId}`);
    setEntryChoiceId(null);
  };

  const handleManualEntry = () => {
    if (!entryChoiceId) {
      return;
    }

    setWorkoutSetupIntent(entryChoiceId, "manual");
    router.push(`/workout/?type=${entryChoiceId}`);
    setEntryChoiceId(null);
  };

  const handleAddDay = (name: string) => {
    const workoutId = addCustomDay(name);
    setEntryChoiceId(workoutId);
  };

  const handleRemoveDayConfirm = () => {
    if (!removeDayId) {
      return;
    }

    removeCustomDay(removeDayId);
    setRemoveDayId(null);
  };

  const completedCount = countLoggedWorkouts(data);
  const entryChoiceLabel = entryChoiceId
    ? getWorkoutLabel(data, entryChoiceId)
    : "";
  const removeDayLabel = removeDayId
    ? getWorkoutLabel(data, removeDayId)
    : "";

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

        <div className="mt-2 grid w-full grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {homeTabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "rounded-cyber border px-2 py-2 text-center transition-colors sm:px-3",
                  isActive
                    ? "border-cyan/50 bg-cyan/10"
                    : "border-line bg-bg/40 hover:border-cyan/30",
                )}
              >
                <Icon className="mx-auto size-5 text-heading sm:size-6" />
                <p className="mt-1 text-[10px] tracking-wide text-dim uppercase sm:text-[11px]">
                  {label}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "punishment" ? (
        <RevealOnScroll>
          <SectionHead index="01." title="Pick Your Punishment" />
          <TerminalWindow title="Choose your workout">
            <div className="grid grid-cols-1 gap-[var(--space-gap-md)] sm:grid-cols-2">
              {!data.coachPlanActive
                ? WORKOUT_TYPES.map((type) => (
                    <DayButton
                      key={type}
                      workoutId={type}
                      label={WORKOUT_LABELS[type]}
                      lastCompletedAt={data.workouts[type].lastCompletedAt}
                      lastSessionDurationSeconds={
                        data.workouts[type].lastSessionDurationSeconds
                      }
                      setupRequired={needsSetup(type)}
                      onSetupClick={() => setEntryChoiceId(type)}
                    />
                  ))
                : null}

              {data.customWorkouts.map((workout) => (
                <DayButton
                  key={workout.id}
                  workoutId={workout.id}
                  label={workout.name}
                  theme={workout.theme}
                  sticker={workout.sticker}
                  lastCompletedAt={workout.lastCompletedAt}
                  lastSessionDurationSeconds={workout.lastSessionDurationSeconds}
                  setupRequired={needsSetup(workout.id)}
                  removable={!data.coachPlanActive}
                  onSetupClick={() => setEntryChoiceId(workout.id)}
                  onRemove={() => setRemoveDayId(workout.id)}
                />
              ))}

              <AddDayButton onClick={() => setShowAddDayModal(true)} />
            </div>
          </TerminalWindow>
        </RevealOnScroll>
      ) : null}

      {activeTab === "calendar" ? (
        <RevealOnScroll>
          <SectionHead index="02." title="Punished days" />
          <WorkoutMonthCalendar completionDates={data.workoutCompletionDates} />
        </RevealOnScroll>
      ) : null}

      {activeTab === "food-tracker" ? (
        <RevealOnScroll>
          <SectionHead index="03." title="Food tracker" />
          <FoodTrackerSection
            profile={data.nutritionProfile}
            onSave={saveNutritionProfile}
          />
        </RevealOnScroll>
      ) : null}

      {activeTab === "coach" ? (
        <RevealOnScroll>
          <SectionHead index="04." title="Senior coach" />
          <CoachChatSection />
        </RevealOnScroll>
      ) : null}

      <footer className="mt-[var(--space-section-lg)] stack-md text-center">
        <p className="text-xs tracking-wide text-dim">
          {completedCount}
          <span className="text-cyan">+</span> logged
        </p>
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

      <AddDayModal
        open={showAddDayModal}
        onAdd={handleAddDay}
        onClose={() => setShowAddDayModal(false)}
      />

      {entryChoiceId ? (
        <WorkoutEntryChoiceModal
          open
          label={entryChoiceLabel}
          onBatch={handleBatchEntry}
          onManual={handleManualEntry}
          onClose={() => setEntryChoiceId(null)}
        />
      ) : null}

      <ConfirmModal
        open={Boolean(removeDayId)}
        title="Remove workout day?"
        message={
          <>
            This will permanently delete{" "}
            <span className="text-magenta">{removeDayLabel}</span> and all of its
            exercises and history.
          </>
        }
        confirmLabel="Remove day"
        cancelLabel="Keep day"
        onConfirm={handleRemoveDayConfirm}
        onCancel={() => setRemoveDayId(null)}
      />

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
