-- AlterTable
ALTER TABLE "plan_meta" ADD COLUMN     "weight_log" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "target_weight_kg" DOUBLE PRECISION,
ADD COLUMN     "weight_unit" TEXT;
