-- AlterTable
ALTER TABLE "users" ADD COLUMN     "apple_sub" TEXT,
ADD COLUMN     "google_sub" TEXT,
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_google_sub_key" ON "users"("google_sub");

-- CreateIndex
CREATE UNIQUE INDEX "users_apple_sub_key" ON "users"("apple_sub");

