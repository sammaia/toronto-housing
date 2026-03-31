-- CreateTable
CREATE TABLE "vacancy_rates" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "geography" TEXT NOT NULL,
    "bedroom_type" TEXT NOT NULL,
    "vacancy_rate" DOUBLE PRECISION NOT NULL,
    "universe" INTEGER NOT NULL,

    CONSTRAINT "vacancy_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_prices" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "geography" TEXT NOT NULL,
    "bedroom_type" TEXT NOT NULL,
    "average_rent" DOUBLE PRECISION NOT NULL,
    "percentage_change" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "rental_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housing_starts" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "geography" TEXT NOT NULL,
    "dwelling_type" TEXT NOT NULL,
    "units" INTEGER NOT NULL,

    CONSTRAINT "housing_starts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vacancy_rates_year_geography_bedroom_type_key" ON "vacancy_rates"("year", "geography", "bedroom_type");

-- CreateIndex
CREATE UNIQUE INDEX "rental_prices_year_geography_bedroom_type_key" ON "rental_prices"("year", "geography", "bedroom_type");

-- CreateIndex
CREATE UNIQUE INDEX "housing_starts_year_month_geography_dwelling_type_key" ON "housing_starts"("year", "month", "geography", "dwelling_type");
