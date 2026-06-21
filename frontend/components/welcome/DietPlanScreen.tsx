"use client";

import {
  PlanEntryChoiceScreen,
  type PlanEntryChoiceScreenProps,
} from "@/components/welcome/PlanEntryChoiceScreen";

type DietPlanScreenProps = Omit<
  PlanEntryChoiceScreenProps,
  "title" | "description"
>;

export function DietPlanScreen(props: DietPlanScreenProps) {
  return (
    <PlanEntryChoiceScreen
      title="Diet Plan"
      description="How would you like to add your meal plan?"
      {...props}
    />
  );
}
