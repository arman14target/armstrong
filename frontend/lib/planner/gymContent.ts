export const gymPlannerSeo = {
  title: "Free Gym Workout Planner & Split Builder | Armstrong",
  description:
    "Generate a custom gym split from your experience, days per week, and goal. Push/pull/legs or full body — sets, reps, and rest built for amateur through pro.",
  keywords: [
    "gym workout planner",
    "workout split generator",
    "bodybuilding program",
    "hypertrophy plan",
    "strength training plan",
    "free workout plan",
    "push pull legs",
  ],
} as const;

export const gymPlannerHero = {
  kicker: "Rule-Based · Built for You",
  badge: "Free",
  headline: "A Gym Split Built for Your Level",
  subhead:
    "Pick your days, goal, and equipment. Slide from amateur to pro and get a full weekly program — exercises, sets, reps, and rest — scaled to how you actually train.",
} as const;

export const gymPlannerFaq = [
  {
    question: "How does the gym planner choose my split?",
    answer:
      "Three days defaults to full body, four to upper/lower, five to PPL plus upper/lower, and six to a double PPL rotation. Volume and exercise count scale with your experience tier.",
  },
  {
    question: "What is the amateur-to-pro slider?",
    answer:
      "It adjusts weekly volume, rest periods, and exercise complexity. Amateurs get fewer movements and longer rest; pros get higher set counts and advanced progression notes.",
  },
  {
    question: "Can I train at home with this plan?",
    answer:
      "Select home equipment and exercises swap to dumbbells, bands, and bodyweight alternatives while keeping the same split structure.",
  },
  {
    question: "How do I track this plan in Armstrong?",
    answer:
      "Open the app to log sets, hit PRs, and sync your plan to the cloud. The planner gives you the blueprint — the app is where you execute it.",
  },
] as const;
