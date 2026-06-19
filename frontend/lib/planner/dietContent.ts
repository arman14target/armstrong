export const dietPlannerSeo = {
  title: "Free Diet Planner & Macro Calculator | Armstrong",
  description:
    "Build a personalized bodybuilding meal plan from your weight, height, and goal. Science-based macros, four meals a day, amateur-to-pro tiers — no signup.",
  keywords: [
    "diet planner",
    "macro calculator",
    "bodybuilding meal plan",
    "bulk meal plan",
    "cut meal plan",
    "protein calculator",
    "free nutrition planner",
  ],
} as const;

export const dietPlannerHero = {
  kicker: "Science-Based · Proven Formulas",
  badge: "Free",
  headline: "Your Macro Meal Plan in 60 Seconds",
  subhead:
    "Enter your stats, slide from amateur to pro, and get a full day of meals with calories, protein, carbs, and fats — built from proven formulas.",
} as const;

export const dietPlannerFaq = [
  {
    question: "How is my diet plan calculated?",
    answer:
      "Armstrong uses the Mifflin–St Jeor equation for basal metabolic rate, applies a training activity factor, then sets protein, fat, and carbs for bulk or cut. Meals are scaled to hit those targets.",
  },
  {
    question: "What changes between amateur and pro tiers?",
    answer:
      "Higher tiers add protein density, meal-prep precision, and timing tips. Amateur plans favor simple repeatable meals; pro plans assume you weigh and log every ingredient.",
  },
  {
    question: "Can I use this meal plan in the Armstrong app?",
    answer:
      "Yes. Open the app to log these meals daily, track macros against your targets, and adjust as you progress.",
  },
  {
    question: "Is this a medical nutrition plan?",
    answer:
      "No. This is general fitness guidance. Consult a registered dietitian for medical conditions, eating disorders, or clinical needs.",
  },
] as const;

export const dietPlannerAbout = {
  title: "How the free diet planner works",
  copy: "Armstrong uses the Mifflin–St Jeor equation for basal metabolic rate, applies a training activity factor, then sets protein, fat, and carbs for a lean bulk or cut. Meals are scaled to hit those targets with four structured slots per day. Slide the experience bar from amateur to pro for tighter meal-prep guidance and higher protein density.",
} as const;
