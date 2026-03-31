-- CreateTable
CREATE TABLE "home_prices" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "property_type" TEXT NOT NULL,
    "avg_price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "home_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "population_growth" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "population" INTEGER NOT NULL,
    "yoy_growth_pct" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "population_growth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "immigration" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "new_permanent_residents" INTEGER NOT NULL,
    "temporary_residents_net" INTEGER NOT NULL,

    CONSTRAINT "immigration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mortgage_rates" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "avg_5yr_fixed_rate" DOUBLE PRECISION NOT NULL,
    "bank_of_canada_policy_rate" DOUBLE PRECISION NOT NULL,
    "avg_variable_rate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "mortgage_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "home_prices_year_property_type_key" ON "home_prices"("year", "property_type");

-- CreateIndex
CREATE UNIQUE INDEX "population_growth_year_region_key" ON "population_growth"("year", "region");

-- CreateIndex
CREATE UNIQUE INDEX "immigration_year_key" ON "immigration"("year");

-- CreateIndex
CREATE UNIQUE INDEX "mortgage_rates_year_key" ON "mortgage_rates"("year");
