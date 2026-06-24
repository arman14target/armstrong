"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { ProfileDashboard } from "@/components/profile/ProfileDashboard";
import { ProfilePreferences } from "@/components/profile/ProfilePreferences";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FoodTrackerSection } from "@/components/FoodTrackerSection";
import { GlitchText } from "@/components/ui/GlitchText";
import { WorkoutCompleteToast } from "@/components/share/WorkoutCompleteToast";
import { SectionHead } from "@/components/ui/SectionHead";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { useGymStore } from "@/hooks/useGymStore";
import { cn } from "@/lib/cn";
import { WORKOUT_TYPES } from "@/lib/types";
import {
  countLoggedWorkouts,
  getWorkoutLabel,
  getWorkoutTemplate,
} from "@/lib/workouts";
import { OPEN_PROFILE_SIGNUP_EVENT } from "@/lib/localSaveReminder";
import { setWorkoutSetupIntent } from "@/lib/workoutSetupIntent";

export function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, hydrated, resetAll, syncAfterAuth, addCustomDay, removeCustomDay, saveNutritionProfile, addFoodEntry, addPlannedFoodEntry, updatePlannedFoodEntry, removeFoodEntry, applyCoachWorkoutChange, applyCoachGymPlan, applyCoachDietPlan, togglePlannedMealComplete } =
    useGymStore();
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [activeTab, setActiveTab] = useState<HomeTab>("workout");
  const [entryChoiceId, setEntryChoiceId] = useState<string | null>(null);
  const [removeDayId, setRemoveDayId] = useState<string | null>(null);
  const [profileSignupRequestId, setProfileSignupRequestId] = useState(0);

  const homeTabs = useMemo(
    () =>
      [
        { id: "workout" as const, label: t("nav.workout"), icon: DumbbellIcon },
        { id: "food-tracker" as const, label: t("nav.nutrition"), icon: FoodIcon },
        { id: "history" as const, label: t("nav.history"), icon: HistoryIcon },
        { id: "coach" as const, label: t("nav.coach"), icon: CoachIcon },
        { id: "profile" as const, label: t("nav.profile"), icon: ProfileIcon },
      ] satisfies Array<{
        id: HomeTab;
        label: string;
        icon: typeof DumbbellIcon;
      }>,
    [t],
  );

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
        <p className="animate-blink text-sm text-green">{t("common.loading")}</p>
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
      <WorkoutCompleteToast />
      <div className="home-screen__content">
      <div className="home-screen__tab-content">
      {activeTab === "workout" ? (
        <RevealOnScroll>
          <SectionHead title={t("workout.pickTitle")} />
          <TerminalWindow title={t("workout.chooseTitle")}>
            <div className="grid grid-cols-2 gap-[var(--space-gap-md)]">
              {!data.coachPlanActive
                ? WORKOUT_TYPES.map((type, index) => (
                    <DayButton
                      key={type}
                      workoutId={type}
                      label={getWorkoutLabel(data, type)}
                      iconIndex={index}
                      lastCompletedAt={data.workouts[type].lastCompletedAt}
                      lastSessionDurationSeconds={
                        data.workouts[type].lastSessionDurationSeconds
                      }
                      setupRequired={needsSetup(type)}
                      onSetupClick={() => setEntryChoiceId(type)}
                    />
                  ))
                : null}

              {data.customWorkouts.map((workout, index) => (
                <DayButton
                  key={workout.id}
                  workoutId={workout.id}
                  label={workout.name}
                  iconIndex={
                    data.coachPlanActive ? index : WORKOUT_TYPES.length + index
                  }
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
          <SectionHead title={t("history.title")} />
          <HistorySection data={data} />
        </RevealOnScroll>
      ) : null}

      {activeTab === "food-tracker" ? (
        <RevealOnScroll>
          <SectionHead title={t("nutrition.title")} />
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
          <SectionHead title={t("profile.title")} />
          <div className="stack-md">
            <ProfilePreferences />
            <ProfileDashboard />
            <ProfileSection
              onAuthSuccess={handleAuthSuccess}
              onClearData={handleClearData}
              openSignupRequestId={profileSignupRequestId}
            />
          </div>
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
                {t("brand.tagline")}
              </p>
            </div>
          </section>

          <footer className="home-screen__footer stack-md text-center">
            <p className="text-xs tracking-wide text-dim">
              {t("brand.logged", { count: completedCount })}
            </p>
            <p className="text-xs tracking-wide text-dim">
              {t("brand.footer", { heart: "♥" })}
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
        title={t("workout.removeDayTitle")}
        message={t("workout.removeDayMessage", { name: removeDayLabel })}
        confirmLabel={t("workout.removeDayConfirm")}
        cancelLabel={t("workout.removeDayCancel")}
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
