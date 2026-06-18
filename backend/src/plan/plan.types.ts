// Mirror of the frontend payload shape (lib/userPlanSync.ts + lib/types.ts).
// Kept structurally identical so the client needs no transform — the backend
// only changes how this payload is persisted (normalized tables vs. jsonb blob).

export type WorkoutType = "push" | "leg" | "abs" | "pull";
export const WORKOUT_TYPES: WorkoutType[] = ["push", "leg", "abs", "pull"];

export interface SetConfig {
  id: string;
  restSeconds: number;
  lastWeight?: number;
  lastReps?: number;
}

export interface Move {
  id: string;
  name: string;
  sets: SetConfig[];
}

export interface WorkoutTemplate {
  moves: Move[];
  lastCompletedAt?: string;
  lastSessionDurationSeconds?: number;
}

export interface CustomWorkoutDay extends WorkoutTemplate {
  id: string;
  name: string;
  theme?: string;
  sticker?: string;
}

export interface ActiveSession {
  workoutType: string;
  startedAt: string;
  setWeights: Record<string, number>;
  setReps: Record<string, number>;
  completedSetIds: string[];
  activeRestSetId?: string;
  restEndsAt?: string;
  baselineWorkout: WorkoutTemplate;
}

export interface WorkoutDayEntry {
  workoutId: string;
  completedAt: string;
  durationSeconds?: number;
}

export interface NutritionProfile {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: "male" | "female";
  goal: "bulk" | "cut";
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  calculatedAt: string;
}

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  loggedAt: string;
  fromPlan?: boolean;
  completed?: boolean;
  mealSlot?: string;
}

export interface AppData {
  workouts: Record<WorkoutType, WorkoutTemplate>;
  customWorkouts: CustomWorkoutDay[];
  activeSession: ActiveSession | null;
  workoutSetupSeen?: Record<string, boolean>;
  workoutCompletionDates?: string[];
  workoutDayLog?: Record<string, WorkoutDayEntry[]>;
  nutritionProfile?: NutritionProfile;
  foodLog?: Record<string, FoodEntry[]>;
  coachPlanActive?: boolean;
}

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface UserPlanPayload {
  appData: AppData;
  coachChat: ChatMessage[];
  onboardingChat: ChatMessage[];
}
