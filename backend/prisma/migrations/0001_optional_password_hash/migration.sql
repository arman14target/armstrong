-- Allow Google-only accounts without a local password.
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
