/*
  Warnings:

  - You are about to drop the `documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recommendations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_user_id_fkey";

-- DropForeignKey
ALTER TABLE "recommendations" DROP CONSTRAINT "recommendations_user_id_fkey";

-- DropTable
DROP TABLE "documents";

-- DropTable
DROP TABLE "recommendations";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "first_name" TEXT,
    "last_name" TEXT,
    "id_number" TEXT,
    "gender" TEXT,
    "net_salary" DECIMAL,
    "credit_score" INTEGER,
    "years_licensed" INTEGER,
    "location" TEXT,
    "city" TEXT,
    "preferred_brand" TEXT,
    "car_type" TEXT,
    "fuel_type" TEXT,
    "transmission" TEXT,
    "expenses_groceries" DECIMAL,
    "expenses_accounts" DECIMAL,
    "expenses_loans" DECIMAL,
    "expenses_other" DECIMAL,
    "password_reset_token" TEXT,
    "password_reset_expiry" TIMESTAMP(3),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "price" DECIMAL,
    "car_fuel_type" TEXT,
    "transmission" TEXT,
    "mileage" INTEGER,
    "image_url" TEXT,
    "dealer_name" TEXT,
    "dealer_location" TEXT,
    "dealer_reputation_note" TEXT,
    "estimated_monthly_cost" DECIMAL,
    "insurance_cost" DECIMAL,
    "loan_cost" DECIMAL,
    "maintenance_cost" DECIMAL,
    "fuel_cost" DECIMAL,
    "score" DECIMAL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "extracted_data" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_id_number_key" ON "user"("id_number");

-- AddForeignKey
ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
