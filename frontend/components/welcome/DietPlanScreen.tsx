"use client";

import { useTranslation } from "react-i18next";
import {
  PlanEntryChoiceScreen,
  type PlanEntryChoiceScreenProps,
} from "@/components/welcome/PlanEntryChoiceScreen";

type DietPlanScreenProps = Omit<
  PlanEntryChoiceScreenProps,
  "title" | "description"
>;

export function DietPlanScreen(props: DietPlanScreenProps) {
  const { t } = useTranslation();

  return (
    <PlanEntryChoiceScreen
      title={t("welcome.dietPlanTitle")}
      description={t("welcome.dietPlanDescription")}
      {...props}
    />
  );
}
