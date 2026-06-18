-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "BuiltinWorkoutType" AS ENUM ('push', 'leg', 'abs', 'pull');

-- CreateEnum
CREATE TYPE "ChatKind" AS ENUM ('coach', 'onboarding');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_meta" (
    "user_id" TEXT NOT NULL,
    "coach_plan_active" BOOLEAN NOT NULL DEFAULT false,
    "workout_setup_seen" JSONB NOT NULL DEFAULT '{}',
    "nutrition_profile" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_meta_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "builtin_workouts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "BuiltinWorkoutType" NOT NULL,
    "last_completed_at" TIMESTAMP(3),
    "last_session_duration_seconds" INTEGER,

    CONSTRAINT "builtin_workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_workouts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "theme" TEXT,
    "sticker" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "last_completed_at" TIMESTAMP(3),
    "last_session_duration_seconds" INTEGER,

    CONSTRAINT "custom_workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moves" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "builtin_workout_id" TEXT,
    "custom_workout_id" TEXT,

    CONSTRAINT "moves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_sets" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "rest_seconds" INTEGER NOT NULL,
    "last_weight" DOUBLE PRECISION,
    "last_reps" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "move_id" TEXT NOT NULL,

    CONSTRAINT "exercise_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_sessions" (
    "user_id" TEXT NOT NULL,
    "workout_type" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "set_weights" JSONB NOT NULL DEFAULT '{}',
    "set_reps" JSONB NOT NULL DEFAULT '{}',
    "completed_set_ids" TEXT[],
    "active_rest_set_id" TEXT,
    "rest_ends_at" TIMESTAMP(3),
    "baseline_workout" JSONB NOT NULL,

    CONSTRAINT "active_sessions_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "completion_dates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,

    CONSTRAINT "completion_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_day_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date_key" TEXT NOT NULL,
    "workout_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL,
    "duration_seconds" INTEGER,

    CONSTRAINT "workout_day_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "date_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein_g" DOUBLE PRECISION NOT NULL,
    "carbs_g" DOUBLE PRECISION NOT NULL,
    "fat_g" DOUBLE PRECISION NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL,
    "from_plan" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN,
    "meal_slot" TEXT,

    CONSTRAINT "food_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" "ChatKind" NOT NULL,
    "client_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "builtin_workouts_user_id_type_key" ON "builtin_workouts"("user_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "custom_workouts_user_id_client_id_key" ON "custom_workouts"("user_id", "client_id");

-- CreateIndex
CREATE INDEX "moves_builtin_workout_id_idx" ON "moves"("builtin_workout_id");

-- CreateIndex
CREATE INDEX "moves_custom_workout_id_idx" ON "moves"("custom_workout_id");

-- CreateIndex
CREATE INDEX "exercise_sets_move_id_idx" ON "exercise_sets"("move_id");

-- CreateIndex
CREATE UNIQUE INDEX "completion_dates_user_id_date_key" ON "completion_dates"("user_id", "date");

-- CreateIndex
CREATE INDEX "workout_day_entries_user_id_date_key_idx" ON "workout_day_entries"("user_id", "date_key");

-- CreateIndex
CREATE INDEX "food_entries_user_id_date_key_idx" ON "food_entries"("user_id", "date_key");

-- CreateIndex
CREATE INDEX "chat_messages_user_id_kind_position_idx" ON "chat_messages"("user_id", "kind", "position");

-- AddForeignKey
ALTER TABLE "plan_meta" ADD CONSTRAINT "plan_meta_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builtin_workouts" ADD CONSTRAINT "builtin_workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_workouts" ADD CONSTRAINT "custom_workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moves" ADD CONSTRAINT "moves_builtin_workout_id_fkey" FOREIGN KEY ("builtin_workout_id") REFERENCES "builtin_workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moves" ADD CONSTRAINT "moves_custom_workout_id_fkey" FOREIGN KEY ("custom_workout_id") REFERENCES "custom_workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_sets" ADD CONSTRAINT "exercise_sets_move_id_fkey" FOREIGN KEY ("move_id") REFERENCES "moves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_sessions" ADD CONSTRAINT "active_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completion_dates" ADD CONSTRAINT "completion_dates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_day_entries" ADD CONSTRAINT "workout_day_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_entries" ADD CONSTRAINT "food_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

