-- CreateEnum
CREATE TYPE "GymDataSource" AS ENUM ('crawl', 'admin', 'user');

-- CreateTable
CREATE TABLE "gyms" (
    "id" TEXT NOT NULL,
    "fsq_place_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "website" TEXT,
    "rating" DOUBLE PRECISION,
    "photo_url" TEXT,
    "last_enriched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gym_price_plans" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_text" TEXT NOT NULL,
    "period" TEXT,
    "source" "GymDataSource" NOT NULL DEFAULT 'crawl',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gym_price_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gym_amenities" (
    "id" TEXT NOT NULL,
    "gym_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "GymDataSource" NOT NULL DEFAULT 'crawl',

    CONSTRAINT "gym_amenities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gyms_fsq_place_id_key" ON "gyms"("fsq_place_id");

-- CreateIndex
CREATE INDEX "gym_price_plans_gym_id_idx" ON "gym_price_plans"("gym_id");

-- CreateIndex
CREATE INDEX "gym_amenities_gym_id_idx" ON "gym_amenities"("gym_id");

-- CreateIndex
CREATE UNIQUE INDEX "gym_amenities_gym_id_name_key" ON "gym_amenities"("gym_id", "name");

-- AddForeignKey
ALTER TABLE "gym_price_plans" ADD CONSTRAINT "gym_price_plans_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gym_amenities" ADD CONSTRAINT "gym_amenities_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
