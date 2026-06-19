#!/usr/bin/env node
/*
 * Seed the exercise catalog from the free-exercise-db dataset.
 *
 *   node scripts/seed-exercises.cjs
 *   npm run seed:exercises
 *
 * Idempotent: upserts each exercise by slug and refreshes its `source:"seed"`
 * media (the 2 demonstration photos) while leaving admin uploads untouched.
 * Reads DATABASE_URL from the environment.
 */
const { PrismaClient } = require("@prisma/client");

const DATA_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

async function main() {
  console.log("Fetching exercise dataset…");
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Dataset fetch failed: ${res.status}`);
  const records = await res.json();
  console.log(`Got ${records.length} exercises. Seeding…`);

  const prisma = new PrismaClient();
  let done = 0;
  try {
    for (const r of records) {
      if (!r.id || !r.name) continue;

      const exercise = await prisma.exercise.upsert({
        where: { slug: r.id },
        create: {
          slug: r.id,
          name: r.name,
          category: r.category ?? null,
          force: r.force ?? null,
          level: r.level ?? null,
          mechanic: r.mechanic ?? null,
          equipment: r.equipment ?? null,
          primaryMuscles: r.primaryMuscles ?? [],
          secondaryMuscles: r.secondaryMuscles ?? [],
          instructions: r.instructions ?? [],
          source: "free-exercise-db",
        },
        update: {
          name: r.name,
          category: r.category ?? null,
          force: r.force ?? null,
          level: r.level ?? null,
          mechanic: r.mechanic ?? null,
          equipment: r.equipment ?? null,
          primaryMuscles: r.primaryMuscles ?? [],
          secondaryMuscles: r.secondaryMuscles ?? [],
          instructions: r.instructions ?? [],
        },
        select: { id: true },
      });

      // Refresh baseline (seed) media without disturbing admin uploads.
      await prisma.exerciseMedia.deleteMany({
        where: { exerciseId: exercise.id, source: "seed" },
      });
      const images = Array.isArray(r.images) ? r.images : [];
      if (images.length > 0) {
        await prisma.exerciseMedia.createMany({
          data: images.map((img, i) => ({
            exerciseId: exercise.id,
            type: "IMAGE",
            url: `${IMAGE_BASE}/${img}`,
            position: i,
            source: "seed",
          })),
        });
      }

      done += 1;
      if (done % 100 === 0) console.log(`  …${done}/${records.length}`);
    }
    console.log(`✓ Seeded ${done} exercises.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
