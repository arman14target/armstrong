/** Typical one-person meal when USDA only reports per-100g values. */
const DEFAULT_MEAL_GRAMS = 250;

const NUTRIENT_NUMBERS = {
  calories: "208",
  protein: "203",
  carbs: "205",
  fat: "204",
} as const;

export interface FoodSearchResult {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingNote: string;
}

interface UsdaNutrient {
  nutrientNumber?: string;
  value?: number;
}

interface UsdaFood {
  fdcId?: number;
  description?: string;
  dataType?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: UsdaNutrient[];
}

function getApiKey(): string {
  return process.env.NEXT_PUBLIC_USDA_API_KEY?.trim() || "DEMO_KEY";
}

function getNutrientValue(
  nutrients: UsdaNutrient[],
  nutrientNumber: string,
): number | undefined {
  const match = nutrients.find(
    (nutrient) => nutrient.nutrientNumber === nutrientNumber,
  );
  if (match?.value === undefined || !Number.isFinite(match.value)) {
    return undefined;
  }
  return match.value;
}

function roundMacro(value: number): number {
  return Math.round(value);
}

function normalizeFood(food: UsdaFood): FoodSearchResult | null {
  const nutrients = food.foodNutrients ?? [];
  const caloriesPerUnit = getNutrientValue(nutrients, NUTRIENT_NUMBERS.calories);
  const proteinPerUnit = getNutrientValue(nutrients, NUTRIENT_NUMBERS.protein);

  if (caloriesPerUnit === undefined && proteinPerUnit === undefined) {
    return null;
  }

  const description = food.description?.trim();
  if (!description || food.fdcId === undefined) {
    return null;
  }

  const isBranded = food.dataType === "Branded";
  let scale = 1;
  let servingNote = "per serving";

  if (isBranded && food.servingSize) {
    const unit = food.servingSizeUnit ?? "g";
    servingNote =
      food.householdServingFullText?.trim() ||
      `${food.servingSize}${unit}`;
  } else {
    scale = DEFAULT_MEAL_GRAMS / 100;
    servingNote = `per ${DEFAULT_MEAL_GRAMS}g serving`;
  }

  const scaleValue = (value: number | undefined): number =>
    roundMacro((value ?? 0) * scale);

  return {
    id: String(food.fdcId),
    name: description,
    calories: scaleValue(caloriesPerUnit),
    proteinG: scaleValue(proteinPerUnit),
    carbsG: scaleValue(
      getNutrientValue(nutrients, NUTRIENT_NUMBERS.carbs),
    ),
    fatG: scaleValue(getNutrientValue(nutrients, NUTRIENT_NUMBERS.fat)),
    servingNote,
  };
}

export async function searchFoods(
  query: string,
  pageSize = 8,
): Promise<FoodSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", getApiKey());
  url.searchParams.set("query", trimmed);
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set(
    "dataType",
    "Branded,Survey (FNDDS),Foundation",
  );

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Food search is unavailable right now. Try again in a moment.");
  }

  const payload = (await response.json()) as { foods?: UsdaFood[] };
  const results: FoodSearchResult[] = [];

  for (const food of payload.foods ?? []) {
    const normalized = normalizeFood(food);
    if (normalized) {
      results.push(normalized);
    }
  }

  return results;
}
