import { WorkoutScreen } from "@/components/WorkoutScreen";
import { WORKOUT_TYPES, isWorkoutType } from "@/lib/types";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return WORKOUT_TYPES.map((type) => ({ type }));
}

interface WorkoutPageProps {
  params: Promise<{ type: string }>;
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { type } = await params;

  if (!isWorkoutType(type)) {
    notFound();
  }

  return <WorkoutScreen workoutType={type} />;
}
