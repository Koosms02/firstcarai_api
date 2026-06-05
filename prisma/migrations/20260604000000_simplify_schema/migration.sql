-- DropForeignKey
ALTER TABLE "recommendations" DROP CONSTRAINT IF EXISTS "recommendations_car_id_fkey";

-- DropForeignKey
ALTER TABLE "insurance_estimates" DROP CONSTRAINT IF EXISTS "insurance_estimates_car_id_fkey";

-- DropForeignKey
ALTER TABLE "user_preferences" DROP CONSTRAINT IF EXISTS "user_preferences_user_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "insurance_estimates";

-- DropTable
DROP TABLE IF EXISTS "user_preferences";

-- DropTable
DROP TABLE IF EXISTS "cars";

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PAYSLIP', 'BANK_STATEMENT', 'UTILITY_BILL');

-- AlterTable users: split full_name into first_name/last_name, add new columns
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "first_name"         TEXT,
  ADD COLUMN IF NOT EXISTS "last_name"          TEXT,
  ADD COLUMN IF NOT EXISTS "city"               TEXT,
  ADD COLUMN IF NOT EXISTS "preferred_brand"    TEXT,
  ADD COLUMN IF NOT EXISTS "car_type"           TEXT,
  ADD COLUMN IF NOT EXISTS "fuel_type"          TEXT,
  ADD COLUMN IF NOT EXISTS "transmission"       TEXT,
  ADD COLUMN IF NOT EXISTS "expenses_groceries" DECIMAL,
  ADD COLUMN IF NOT EXISTS "expenses_accounts"  DECIMAL,
  ADD COLUMN IF NOT EXISTS "expenses_loans"     DECIMAL,
  ADD COLUMN IF NOT EXISTS "expenses_other"     DECIMAL;

-- Migrate existing full_name into first_name / last_name
UPDATE "users"
SET
  "first_name" = SPLIT_PART("full_name", ' ', 1),
  "last_name"  = NULLIF(TRIM(SUBSTRING("full_name" FROM POSITION(' ' IN "full_name") + 1)), '')
WHERE "full_name" IS NOT NULL;

-- Drop the old full_name column
ALTER TABLE "users" DROP COLUMN IF EXISTS "full_name";

-- Make id_number unique (data may already have nulls, so only enforce on non-null values)
-- We do this after migration because old rows may have no id_number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'users_id_number_key'
  ) THEN
    CREATE UNIQUE INDEX "users_id_number_key" ON "users"("id_number") WHERE "id_number" IS NOT NULL;
  END IF;
END $$;

-- AlterTable recommendations: drop car_id FK column, add inline car & dealer fields
ALTER TABLE "recommendations"
  DROP COLUMN IF EXISTS "car_id",
  ADD COLUMN IF NOT EXISTS "is_preferred"          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "make"                  TEXT,
  ADD COLUMN IF NOT EXISTS "model"                 TEXT,
  ADD COLUMN IF NOT EXISTS "year"                  INTEGER,
  ADD COLUMN IF NOT EXISTS "price"                 DECIMAL,
  ADD COLUMN IF NOT EXISTS "car_fuel_type"         TEXT,
  ADD COLUMN IF NOT EXISTS "transmission"          TEXT,
  ADD COLUMN IF NOT EXISTS "mileage"               INTEGER,
  ADD COLUMN IF NOT EXISTS "image_url"             TEXT,
  ADD COLUMN IF NOT EXISTS "dealer_name"           TEXT,
  ADD COLUMN IF NOT EXISTS "dealer_location"       TEXT,
  ADD COLUMN IF NOT EXISTS "dealer_reputation_note" TEXT;

-- CreateTable documents
CREATE TABLE "documents" (
  "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        UUID NOT NULL,
  "document_type"  "DocumentType" NOT NULL,
  "file_name"      TEXT NOT NULL,
  "extracted_data" JSONB,
  "created_at"     TIMESTAMP(6) DEFAULT NOW(),

  CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey documents → users
ALTER TABLE "documents"
  ADD CONSTRAINT "documents_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
