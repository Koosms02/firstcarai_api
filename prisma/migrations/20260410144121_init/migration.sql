-- CreateTable
CREATE TABLE "cars" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "price" DECIMAL,
    "mileage" INTEGER,
    "fuel_type" TEXT,
    "transmission" TEXT,
    "scraped_source" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "net_salary" DECIMAL,
    "credit_score" INTEGER,
    "years_licensed" INTEGER,
    "gender" TEXT,
    "location" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "car_id" UUID,
    "estimated_monthly_cost" DECIMAL,
    "insurance_cost" DECIMAL,
    "loan_cost" DECIMAL,
    "maintenance_cost" DECIMAL,
    "fuel_cost" DECIMAL,
    "score" DECIMAL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_estimates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "car_id" UUID,
    "location" TEXT,
    "risk_category" TEXT,
    "estimated_monthly" DECIMAL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "preferred_brand" TEXT,
    "car_type" TEXT,
    "fuel_type" TEXT,
    "transmission" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scraping_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source" TEXT,
    "records_added" INTEGER,
    "status" TEXT,
    "started_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "scraping_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "insurance_estimates" ADD CONSTRAINT "insurance_estimates_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
