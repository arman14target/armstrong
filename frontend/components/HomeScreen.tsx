"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AddDayButton } from "@/components/AddDayButton";
import { AddDayModal } from "@/components/AddDayModal";
import { RevealOnScroll } from "@/components/effects/RevealOnScroll";
import { DayButton } from "@/components/DayButton";
import { WorkoutEntryChoiceModal } from "@/components/WorkoutEntryChoiceModal";
import { HistorySection } from "@/components/HistorySection";
import { CoachChatSection } from "@/components/CoachChatSection";
import { HomeBottomNav, type HomeTab } from "@/components/HomeBottomNav";
import {
  CoachIcon,
  HistoryIcon,
  DumbbellIcon,
  FoodIcon,
  ProfileIcon,
} from "@/components/icons/ActionIcons";
import { ProfileSection } from "@/components/ProfileSection";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FoodTrackerSection } from "@/components/FoodTrackerSection";
import { GlitchText } from "@/components/ui/GlitchText";
import { SectionHead } from "@/components/ui/SectionHead";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { useGymStore } from "@/hooks/useGymStore";
import { cn } from "@/lib/cn";
import { WORKOUT_LABELS, WORKOUT_TYPES } from "@/lib/types";
import {
  countLoggedWorkouts,
  getWorkoutLabel,
  getWorkoutTemplate,
} from "@/lib/workouts";
import { OPEN_PROFILE_SIGNUP_EVENT } from "@/lib/localSaveReminder";
import { setWorkoutSetupIntent } from "@/lib/workoutSetupIntent";

const homeTabs: Array<{
  id: HomeTab;
  label: string;
  icon: typeof DumbbellIcon;
}> = [
  { id: "workout", label: "Workout", icon: DumbbellIcon },
  { id: "food-tracker", label: "Food tracker", icon: FoodIcon },
  { id: "history", label: "History", icon: HistoryIcon },
  { id: "coach", label: "Coach", icon: CoachIcon },
  { id: "profile", label: "Profile", icon: ProfileIcon },
];

export function HomeScreen() {
  const router = useRouter();
  const { data, hydrated, resetAll, syncAfterAuth, addCustomDay, removeCustomDay, saveNutritionProfile, addFoodEntry, addPlannedFoodEntry, updatePlannedFoodEntry, removeFoodEntry, applyCoachWorkoutChange, applyCoachGymPlan, applyCoachDietPlan, togglePlannedMealComplete } =
    useGymStore();
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [activeTab, setActiveTab] = useState<HomeTab>("workout");
  const [entryChoiceId, setEntryChoiceId] = useState<string | null>(null);
  const [removeDayId, setRemoveDayId] = useState<string | null>(null);
  const [profileSignupRequestId, setProfileSignupRequestId] = useState(0);

  useEffect(() => {
    const openProfileSignup = () => {
      setActiveTab("profile");
      setProfileSignupRequestId((current) => current + 1);
    };

    window.addEventListener(OPEN_PROFILE_SIGNUP_EVENT, openProfileSignup);
    return () => {
      window.removeEventListener(OPEN_PROFILE_SIGNUP_EVENT, openProfileSignup);
    };
  }, []);

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

  const handleAuthSuccess = async (userId: string, mode: "sign-in" | "sign-up") => {
    await syncAfterAuth(userId, mode);
  };

  const handleClearData = async () => {
    await resetAll();
  };

  if (!hydrated) {
    return (
      <main className="page-shell--center">
        <p className="animate-blink text-sm text-green">Loading your workouts...</p>
      </main>
    );
  }

  return (
    <main
      className={cn(
        "page-shell page-shell--home page-shell--footer",
        activeTab === "coach" && "page-shell--home-coach",
      )}
    >
      <div className="home-screen__content">
      <div className="home-screen__tab-content">
      {activeTab === "workout" ? (
        <RevealOnScroll>
          <SectionHead title="Pick Your Workout" />
          <TerminalWindow title="Choose your workout">
            <div className="grid grid-cols-2 gap-[var(--space-gap-md)]">
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
                  removable
                  onSetupClick={() => setEntryChoiceId(workout.id)}
                  onRemove={() => setRemoveDayId(workout.id)}
                />
              ))}

              <AddDayButton onClick={() => setShowAddDayModal(true)} />
            </div>
          </TerminalWindow>
        </RevealOnScroll>
      ) : null}

      {activeTab === "history" ? (
        <RevealOnScroll>
          <SectionHead title="History" />
          <HistorySection data={data} />
        </RevealOnScroll>
      ) : null}

      {activeTab === "food-tracker" ? (
        <RevealOnScroll>
          <SectionHead title="Food tracker" />
          <FoodTrackerSection
            profile={data.nutritionProfile}
            foodLog={data.foodLog ?? {}}
            onSave={saveNutritionProfile}
            onAddFood={addFoodEntry}
            onRemoveFood={removeFoodEntry}
            onAddPlannedFood={addPlannedFoodEntry}
            onUpdatePlannedFood={updatePlannedFoodEntry}
            onTogglePlannedMeal={togglePlannedMealComplete}
          />
        </RevealOnScroll>
      ) : null}

      {activeTab === "coach" ? (
        <div className="home-coach-tab">
          <CoachChatSection
            layout="home"
            appData={data}
            onApplyWorkoutChange={applyCoachWorkoutChange}
            onApplyDietPlan={applyCoachDietPlan}
            onApplyGymPlan={applyCoachGymPlan}
          />
        </div>
      ) : null}

      {activeTab === "profile" ? (
        <RevealOnScroll>
          <SectionHead title="Profile" />
          <ProfileSection
            onAuthSuccess={handleAuthSuccess}
            onClearData={handleClearData}
            openSignupRequestId={profileSignupRequestId}
          />
        </RevealOnScroll>
      ) : null}
      </div>

      {activeTab !== "coach" ? (
        <>
          <section className="hero-section home-screen__brand">
            <div className="w-full">
              <GlitchText
                text="ARMSTRONG"
                className="text-2xl tracking-[2px] sm:text-4xl lg:text-5xl"
              />
              <p className="mt-1 text-xs text-dim sm:text-sm">
                Train hard. Track everything.
              </p>
            </div>
          </section>

          <footer className="home-screen__footer stack-md text-center">
            <p className="text-xs tracking-wide text-dim">
              {completedCount}
              <span className="text-cyan">+</span> logged
            </p>
            <p className="text-xs tracking-wide text-dim">
              Built with <span className="text-magenta">♥</span> and protein shakes
              — Armstrong
            </p>
          </footer>
        </>
      ) : null}
      </div>

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

      <HomeBottomNav
        tabs={homeTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </main>
  );
}
