"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActiveWorkoutConflictSheet } from "@/components/ActiveWorkoutConflictSheet";
import { AddDayButton } from "@/components/AddDayButton";
import { AddDayModal } from "@/components/AddDayModal";
import { RevealOnScroll } from "@/components/effects/RevealOnScroll";
import { DayButton } from "@/components/DayButton";
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
import {
  WorkoutBottomSheet,
  type WorkoutSheetMode,
} from "@/components/WorkoutBottomSheet";
import type { WorkoutCloseReason } from "@/components/WorkoutScreen";
import { WorkoutMinimizedBar } from "@/components/WorkoutMinimizedBar";
import { WorkoutStartChoiceSheet } from "@/components/WorkoutStartChoiceSheet";
import { useGymStore } from "@/hooks/useGymStore";
import { getInProgressSessionWorkoutId } from "@/lib/activeSession";
import { cn } from "@/lib/cn";
import { cancelRestNotification } from "@/lib/restNotifications";
import { WORKOUT_TYPES } from "@/lib/types";
import {
  countLoggedWorkouts,
  getWorkoutLabel,
  getWorkoutTemplate,
} from "@/lib/workouts";
import { OPEN_PROFILE_SIGNUP_EVENT } from "@/lib/localSaveReminder";

export function HomeScreen() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { data, hydrated, resetAll, syncAfterAuth, addCustomDay, removeCustomDay, saveNutritionProfile, addFoodEntry, addPlannedFoodEntry, updatePlannedFoodEntry, removeFoodEntry, applyCoachWorkoutChange, applyCoachGymPlan, applyCoachDietPlan, togglePlannedMealComplete, finishDay, cancelSession } =
    useGymStore();
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [activeTab, setActiveTab] = useState<HomeTab>("workout");
  const [choiceWorkoutId, setChoiceWorkoutId] = useState<string | null>(null);
  const [openWorkout, setOpenWorkout] = useState<{
    workoutId: string;
    mode: WorkoutSheetMode;
    minimized: boolean;
  } | null>(null);
  const [removeDayId, setRemoveDayId] = useState<string | null>(null);
  const [sessionConflict, setSessionConflict] = useState<{
    activeWorkoutId: string;
    pendingWorkoutId: string;
    pendingMode: WorkoutSheetMode;
  } | null>(null);
  const [profileSignupRequestId, setProfileSignupRequestId] = useState(0);

  const inProgressWorkoutId = useMemo(
    () => getInProgressSessionWorkoutId(data),
    [data],
  );

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

  const openWorkoutChoice = useCallback(
    (workoutId: string) => {
      if (openWorkout?.workoutId === workoutId && !openWorkout.minimized) {
        return;
      }

      setChoiceWorkoutId(workoutId);
    },
    [openWorkout],
  );

  const openWorkoutSheet = useCallback(
    (workoutId: string, mode: WorkoutSheetMode) => {
      setChoiceWorkoutId(null);
      setSessionConflict(null);
      setOpenWorkout({ workoutId, mode, minimized: false });
    },
    [],
  );

  const proceedToPendingWorkout = useCallback(
    (pendingWorkoutId: string, pendingMode: WorkoutSheetMode) => {
      setSessionConflict(null);
      setChoiceWorkoutId(null);
      setOpenWorkout(null);
      openWorkoutSheet(pendingWorkoutId, pendingMode);
    },
    [openWorkoutSheet],
  );

  const handleWorkoutStart = useCallback(() => {
    if (!choiceWorkoutId) {
      return;
    }

    if (
      inProgressWorkoutId &&
      inProgressWorkoutId !== choiceWorkoutId
    ) {
      setSessionConflict({
        activeWorkoutId: inProgressWorkoutId,
        pendingWorkoutId: choiceWorkoutId,
        pendingMode: "session",
      });
      setChoiceWorkoutId(null);
      return;
    }

    openWorkoutSheet(choiceWorkoutId, "session");
  }, [choiceWorkoutId, inProgressWorkoutId, openWorkoutSheet]);

  const handleWorkoutEditLayout = useCallback(() => {
    if (!choiceWorkoutId) {
      return;
    }
    openWorkoutSheet(choiceWorkoutId, "layout");
  }, [choiceWorkoutId, openWorkoutSheet]);

  const handleWorkoutMinimize = useCallback(() => {
    setOpenWorkout((current) =>
      current ? { ...current, minimized: true } : current,
    );
  }, []);

  const handleWorkoutExpand = useCallback(() => {
    setOpenWorkout((current) =>
      current ? { ...current, minimized: false } : current,
    );
  }, []);

  const handleWorkoutClose = useCallback(
    (reason?: WorkoutCloseReason) => {
      if (reason?.sessionEnded) {
        setOpenWorkout(null);
        return;
      }

      const closingMode = openWorkout?.mode;

      if (closingMode === "layout" && inProgressWorkoutId) {
        setOpenWorkout({
          workoutId: inProgressWorkoutId,
          mode: "session",
          minimized: true,
        });
        return;
      }

      if (closingMode === "session" && inProgressWorkoutId) {
        setOpenWorkout({
          workoutId: inProgressWorkoutId,
          mode: "session",
          minimized: true,
        });
        return;
      }

      setOpenWorkout(null);
    },
    [inProgressWorkoutId, openWorkout?.mode],
  );

  const handleConflictFinish = useCallback(() => {
    if (!sessionConflict) {
      return;
    }

    const completedCount = data.activeSession?.completedSetIds.length ?? 0;
    if (completedCount === 0) {
      const confirmed = window.confirm(t("workout.finishNoSetsConfirm"));
      if (!confirmed) {
        return;
      }
    }

    cancelRestNotification();
    finishDay(sessionConflict.activeWorkoutId);
    proceedToPendingWorkout(
      sessionConflict.pendingWorkoutId,
      sessionConflict.pendingMode,
    );
  }, [data.activeSession?.completedSetIds.length, finishDay, proceedToPendingWorkout, sessionConflict, t]);

  const handleConflictCancel = useCallback(() => {
    if (!sessionConflict) {
      return;
    }

    const completedCount = data.activeSession?.completedSetIds.length ?? 0;
    const confirmed = window.confirm(
      completedCount > 0
        ? t("workout.cancelWithProgressConfirm")
        : t("workout.cancelConfirm"),
    );
    if (!confirmed) {
      return;
    }

    cancelRestNotification();
    cancelSession(sessionConflict.activeWorkoutId);
    proceedToPendingWorkout(
      sessionConflict.pendingWorkoutId,
      sessionConflict.pendingMode,
    );
  }, [cancelSession, data.activeSession?.completedSetIds.length, proceedToPendingWorkout, sessionConflict, t]);

  const handleConflictKeep = useCallback(() => {
    if (!sessionConflict) {
      setSessionConflict(null);
      return;
    }

    const activeId = sessionConflict.activeWorkoutId;
    setSessionConflict(null);
    setChoiceWorkoutId(null);
    setOpenWorkout({
      workoutId: activeId,
      mode: "session",
      minimized: false,
    });
  }, [sessionConflict]);

  useEffect(() => {
    if (!hydrated || !inProgressWorkoutId) {
      return;
    }

    setOpenWorkout((current) => {
      if (current !== null) {
        return current;
      }

      return {
        workoutId: inProgressWorkoutId,
        mode: "session",
        minimized: true,
      };
    });
  }, [hydrated, inProgressWorkoutId]);

  useEffect(() => {
    const workoutId = searchParams.get("workout");
    if (!workoutId || !hydrated) {
      return;
    }

    if (!getWorkoutTemplate(data, workoutId)) {
      return;
    }

    openWorkoutChoice(workoutId);
    window.history.replaceState({}, "", "/app");
  }, [data, hydrated, openWorkoutChoice, searchParams]);

  const handleAddDay = (name: string) => {
    const workoutId = addCustomDay(name);
    setChoiceWorkoutId(workoutId);
  };

  const handleRemoveDayConfirm = () => {
    if (!removeDayId) {
      return;
    }

    removeCustomDay(removeDayId);
    setRemoveDayId(null);
  };

  const completedCount = countLoggedWorkouts(data);
  const choiceWorkoutLabel = choiceWorkoutId
    ? getWorkoutLabel(data, choiceWorkoutId)
    : "";
  const openWorkoutLabel = openWorkout
    ? getWorkoutLabel(data, openWorkout.workoutId)
    : "";
  const activeSessionStartedAt =
    openWorkout?.mode === "session" &&
    data.activeSession?.workoutType === openWorkout.workoutId
      ? data.activeSession.startedAt
      : undefined;
  const conflictCurrentLabel = sessionConflict
    ? getWorkoutLabel(data, sessionConflict.activeWorkoutId)
    : "";
  const conflictNextLabel = sessionConflict
    ? getWorkoutLabel(data, sessionConflict.pendingWorkoutId)
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
                      label={getWorkoutLabel(data, type)}
                      iconIndex={index}
                      lastCompletedAt={data.workouts[type].lastCompletedAt}
                      lastSessionDurationSeconds={
                        data.workouts[type].lastSessionDurationSeconds
                      }
                      onClick={() => openWorkoutChoice(type)}
                    />
                  ))
                : null}

              {data.customWorkouts.map((workout, index) => (
                <DayButton
                  key={workout.id}
                  label={workout.name}
                  iconIndex={
                    data.coachPlanActive ? index : WORKOUT_TYPES.length + index
                  }
                  lastCompletedAt={workout.lastCompletedAt}
                  lastSessionDurationSeconds={workout.lastSessionDurationSeconds}
                  removable
                  onClick={() => openWorkoutChoice(workout.id)}
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

      {choiceWorkoutId ? (
        <WorkoutStartChoiceSheet
          open
          label={choiceWorkoutLabel}
          onStart={handleWorkoutStart}
          onEditLayout={handleWorkoutEditLayout}
          onClose={() => setChoiceWorkoutId(null)}
        />
      ) : null}

      {sessionConflict ? (
        <ActiveWorkoutConflictSheet
          open
          currentLabel={conflictCurrentLabel}
          nextLabel={conflictNextLabel}
          onFinish={handleConflictFinish}
          onCancelSession={handleConflictCancel}
          onKeepCurrent={handleConflictKeep}
        />
      ) : null}

      {openWorkout ? (
        <>
          <WorkoutBottomSheet
            open
            minimized={openWorkout.minimized}
            workoutId={openWorkout.workoutId}
            mode={openWorkout.mode}
            onMinimize={handleWorkoutMinimize}
            onClose={handleWorkoutClose}
          />
          {openWorkout.minimized ? (
            <WorkoutMinimizedBar
              label={openWorkoutLabel}
              startedAt={activeSessionStartedAt}
              onExpand={handleWorkoutExpand}
            />
          ) : null}
        </>
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
