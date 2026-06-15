/*
  Warnings:

  - You are about to drop the `document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recommendation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "document" DROP CONSTRAINT "document_user_id_fkey";

-- DropForeignKey
ALTER TABLE "recommendation" DROP CONSTRAINT "recommendation_user_id_fkey";

-- DropTable
DROP TABLE "document";

-- DropTable
DROP TABLE "recommendation";

-- DropTable
DROP TABLE "user";

-- CreateTable
CREATE TABLE "User" (
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

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preference" (
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

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "extracted_data" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_number_key" ON "User"("id_number");

-- AddForeignKey
ALTER TABLE "Preference" ADD CONSTRAINT "Preference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
