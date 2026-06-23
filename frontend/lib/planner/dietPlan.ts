import {
  calculateNutritionTargets,
  formatGoalLabel,
  formatMealSlotLabel,
  inferNutritionGoal,
  type MealSlot,
  type NutritionGoal,
  type NutritionInputs,
  type NutritionSex,
  type NutritionTargets,
} from "@/lib/nutrition";
import {
  type ExperienceLevel,
  experienceVolumeMultiplier,
} from "@/lib/planner/experience";

export interface DietPlanInputs extends NutritionInputs {
  experience: ExperienceLevel;
}

export interface PlannedMeal {
  slot: MealSlot;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  foods: string[];
  tip?: string;
}

export interface DietPlanResult {
  targets: NutritionTargets;
  meals: PlannedMeal[];
  experience: ExperienceLevel;
  goalLabel: string;
  hydrationLiters: number;
  mealPrepNote: string;
  proteinPerMealG: number;
}

interface MealBlueprint {
  slot: MealSlot;
  share: number;
  foods: Record<ExperienceLevel, string[]>;
  tips: Record<ExperienceLevel, string>;
}

const MEAL_BLUEPRINTS: MealBlueprint[] = [
  {
    slot: "breakfast",
    share: 0.25,
    foods: {
      amateur: ["Oatmeal with banana", "2 whole eggs", "Black coffee"],
      intermediate: ["Greek yogurt bowl", "Berries + honey", "Whole-grain toast"],
      advanced: ["Egg white omelet (4 whites)", "Oats + whey", "Almond butter"],
      pro: ["Measured oats + whey isolate", "Egg whites + avocado", "Electrolytes"],
    },
    tips: {
      amateur: "Keep it simple — repeat this most mornings.",
      intermediate: "Hit ~30g protein before noon.",
      advanced: "Front-load protein early for satiety.",
      pro: "Weigh dry oats; track every gram.",
    },
  },
  {
    slot: "lunch",
    share: 0.3,
    foods: {
      amateur: ["Chicken breast sandwich", "Side salad", "Water"],
      intermediate: ["Rice bowl + chicken thigh", "Mixed vegetables", "Olive oil drizzle"],
      advanced: ["Lean beef + jasmine rice", "Roasted veggies", "Fruit"],
      pro: ["Weighed rice + lean protein", "Micronutrient salad", "Digestive enzymes"],
    },
    tips: {
      amateur: "Pre-cook chicken on Sunday.",
      intermediate: "Balance carbs around training time.",
      advanced: "Largest carb meal pre- or post-workout.",
      pro: "Meal prep 4 identical containers.",
    },
  },
  {
    slot: "dinner",
    share: 0.35,
    foods: {
      amateur: ["Pasta with turkey meatballs", "Steamed broccoli", "Parmesan"],
      intermediate: ["Salmon + potatoes", "Green beans", "Lemon"],
      advanced: ["White fish + sweet potato", "Asparagus", "Herb sauce"],
      pro: ["Cod + weighed sweet potato", "Fibrous greens", "Omega-3"],
    },
    tips: {
      amateur: "Add a vegetable every dinner.",
      intermediate: "Keep fats moderate at night.",
      advanced: "Prioritize lean protein if cutting.",
      pro: "Stop eating 2h before bed on cut.",
    },
  },
  {
    slot: "snack",
    share: 0.1,
    foods: {
      amateur: ["Protein shake", "Apple"],
      intermediate: ["Cottage cheese + crackers", "Protein bar"],
      advanced: ["Whey + rice cakes", "Rice cakes + PB"],
      pro: ["Casein shake", "Measured nut butter"],
    },
    tips: {
      amateur: "Use snack only if hungry.",
      intermediate: "Bridge long gaps between meals.",
      advanced: "Post-workout shake if training late.",
      pro: "Casein before sleep on bulk.",
    },
  },
];

function round(value: number): number {
  return Math.round(value);
}

function scaleMealMacros(
  targets: NutritionTargets,
  share: number,
): Pick<PlannedMeal, "calories" | "proteinG" | "carbsG" | "fatG"> {
  return {
    calories: round(targets.dailyCalories * share),
    proteinG: round(targets.proteinG * share),
    carbsG: round(targets.carbsG * share),
    fatG: round(targets.fatG * share),
  };
}

function mealName(slot: MealSlot, experience: ExperienceLevel): string {
  const base = formatMealSlotLabel(slot);
  if (experience === "pro") return `${base} — precision`;
  if (experience === "advanced") return `${base} — performance`;
  return base;
}

export function generateDietPlan(inputs: DietPlanInputs): DietPlanResult {
  const goal = inferNutritionGoal(inputs.weightKg, inputs.targetWeightKg);
  const targets = calculateNutritionTargets({ ...inputs, goal });
  const multiplier = experienceVolumeMultiplier(inputs.experience);

  const adjustedTargets: NutritionTargets = {
    dailyCalories: targets.dailyCalories,
    proteinG: round(targets.proteinG * multiplier),
    carbsG: round(targets.carbsG * (goal === "cut" ? 0.95 : 1)),
    fatG: targets.fatG,
  };

  const macroTotal =
    adjustedTargets.proteinG * 4 +
    adjustedTargets.carbsG * 4 +
    adjustedTargets.fatG * 9;
  if (macroTotal > adjustedTargets.dailyCalories + 50) {
    adjustedTargets.carbsG = round(
      (adjustedTargets.dailyCalories -
        adjustedTargets.proteinG * 4 -
        adjustedTargets.fatG * 9) /
        4,
    );
  }

  const meals = MEAL_BLUEPRINTS.map((blueprint) => {
    const macros = scaleMealMacros(adjustedTargets, blueprint.share);
    return {
      slot: blueprint.slot,
      name: mealName(blueprint.slot, inputs.experience),
      ...macros,
      foods: blueprint.foods[inputs.experience],
      tip: blueprint.tips[inputs.experience],
    };
  });

  const hydrationLiters =
    Math.round(
      (inputs.weightKg * 0.035 + (inputs.experience === "pro" ? 0.5 : 0)) * 10,
    ) / 10;

  const mealPrepNote =
    inputs.experience === "amateur"
      ? "Batch-cook protein twice a week. Same breakfast 5 days is fine."
      : inputs.experience === "intermediate"
        ? "Prep lunches Sunday + Wednesday. Keep a protein backup in the freezer."
        : inputs.experience === "advanced"
          ? "Weigh staples once, eat from templates. Track training-day carb shifts."
          : "Full weekly prep. Scale every ingredient. Log before you eat.";

  return {
    targets: adjustedTargets,
    meals,
    experience: inputs.experience,
    goalLabel: formatGoalLabel(goal),
    hydrationLiters,
    mealPrepNote,
    proteinPerMealG: round(adjustedTargets.proteinG / meals.length),
  };
}

export const DEFAULT_DIET_INPUTS: DietPlanInputs = {
  weightKg: 80,
  heightCm: 178,
  age: 28,
  sex: "male",
  targetWeightKg: 83,
  experience: "intermediate",
};

export type { NutritionGoal, NutritionSex };
