import { WorkoutScreen } from "@/components/WorkoutScreen";
import { WORKOUT_TYPES } from "@/lib/types";

export const dynamicParams = true;

export function generateStaticParams() {
  return WORKOUT_TYPES.map((type) => ({ type }));
}

interface WorkoutPageProps {
  params: Promise<{ type: string }>;
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { type } = await params;

  return <WorkoutScreen workoutId={type} />;
}
