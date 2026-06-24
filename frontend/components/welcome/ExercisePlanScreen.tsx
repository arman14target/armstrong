"use client";

import { useTranslation } from "react-i18next";
import {
  PlanEntryChoiceScreen,
  type PlanEntryChoiceScreenProps,
} from "@/components/welcome/PlanEntryChoiceScreen";

type ExercisePlanScreenProps = Omit<
  PlanEntryChoiceScreenProps,
  "title" | "description"
>;

export function ExercisePlanScreen(props: ExercisePlanScreenProps) {
  const { t } = useTranslation();

  return (
    <PlanEntryChoiceScreen
      title={t("welcome.exercisePlanTitle")}
      description={t("welcome.exercisePlanDescription")}
      {...props}
    />
  );
}
