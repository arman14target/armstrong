"use client";

import {
  PlanEntryChoiceScreen,
  type PlanEntryChoiceScreenProps,
} from "@/components/welcome/PlanEntryChoiceScreen";

type ExercisePlanScreenProps = Omit<
  PlanEntryChoiceScreenProps,
  "title" | "description"
>;

export function ExercisePlanScreen(props: ExercisePlanScreenProps) {
  return (
    <PlanEntryChoiceScreen
      title="Exercise Plan"
      description="How would you like to add your workout plan?"
      {...props}
    />
  );
}
