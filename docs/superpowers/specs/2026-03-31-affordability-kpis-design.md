# Affordability KPIs & Supply/Demand — Design Spec

**Date:** 2026-03-31
**Status:** Approved

## Overview

Add 5 high-impact analytical KPIs to the Toronto Housing dashboard:

1. **Rent-to-Income ratio** — annual rent as % of median household income
2. **Price-to-Income ratio** — average detached price ÷ median household income
3. **% of income on housing** — derived from rent-to-income (same metric, different framing)
4. **Supply Gap** — housing starts vs. estimated new household demand
5. **SNLR** — Sales-to-New-Listings Ratio (market balance indicator)

Architecture chosen: **Hybrid (Option C)** — 2 new KPI cards on Overview, new Affordability tab in Trends, SNLR added to Market page.

---

## Data Model

### New table: `MedianIncome`

```prisma
model MedianIncome {
  id                    Int    @id @default(autoincrement())
  year                  Int
  region                String  // "toronto_cma" | "ontario"
  medianHouseholdIncome Int     // annual, CAD

  @@unique([year, region])
}
```

Seeded with StatCan Census estimates for Toronto CMA, 2018–2024:

| Year | Toronto CMA Median HH Income |
|------|------------------------------|
| 2018 | $82,000 |
| 2019 | $84,500 |
| 2020 | $85,000 |
| 2021 | $87,000 |
| 2022 | $90,000 |
| 2023 | $93,000 |
| 2024 | $96,000 |

### New table: `MarketActivity`

```prisma
model MarketActivity {
  id          Int   @id @default(autoincrement())
  year        Int   @unique
  totalSales  Int   // annual TRREB sales volume
  newListings Int   // annual TRREB new listings
  snlr        Float // totalSales / newListings * 100
}
```

Seeded manually with historical TRREB data (same update cadence as `HomePrices`).

| Year | Total Sales | New Listings | SNLR  |
|------|-------------|--------------|-------|
| 2018 | 77,426      | 155,823      | 49.7% |
| 2019 | 87,825      | 152,693      | 57.5% |
| 2020 | 95,151      | 153,022      | 62.2% |
| 2021 | 121,712     | 175,566      | 69.3% |
| 2022 | 75,140      | 184,513      | 40.7% |
| 2023 | 65,982      | 166,600      | 39.6% |
| 2024 | 67,610      | 172,678      | 39.1% |

---

## Calculated Metrics

All derived at query time, not stored:

```
price_to_income = avg_detached_price / median_household_income
rent_to_income  = (avg_monthly_rent_2bed * 12) / median_household_income * 100
supply_gap_units = estimated_demand - housing_starts
estimated_demand = annual_population_growth_absolute / 2.5
// annual_population_growth_absolute = absolute persons added that year (from PopulationGrowth table)
// 2.5 = avg persons per household (Statistics Canada estimate)
```

Reference benchmarks (shown as annotations on charts):
- Price-to-Income: **5×** (international healthy market standard)
- Rent-to-Income: **30%** (widely used affordability threshold)
- SNLR zones: `< 40%` buyer's market · `40–60%` balanced · `> 60%` seller's market

---

## Backend Changes

### New endpoints

**`GET /api/v1/affordability`**
Returns time series for all affordability metrics joined with income data:
```json
[{
  "year": 2024,
  "medianIncome": 96000,
  "avgRent2Bed": 2740,
  "avgDetachedPrice": 1480000,
  "rentToIncome": 34.2,
  "priceToIncome": 15.4,
  "housingStarts": 42300,
  "estimatedDemand": 70400,
  "supplyGap": 28100
}]
```

**`GET /api/v1/market/activity`**
Returns SNLR time series:
```json
[{ "year": 2024, "totalSales": 67610, "newListings": 172678, "snlr": 39.1 }]
```

### Modified endpoint

**`GET /api/v1/overview/kpis`** — adds two new fields:
```json
{
  "rentToIncome": 34.2,
  "priceToIncome": 15.4
}
```

### New Prisma module

`AffordabilityModule` at `backend/src/modules/affordability/` with `AffordabilityService` and `AffordabilityController`. Follows the same structure as existing modules (vacancy, rental, market). Registered in `AppModule`.

---

## Frontend Changes

### 1. Overview page (`DashboardPage.tsx`)

- Reorganize KPI card grid from `xl:grid-cols-6` → **2 rows of 4** (`xl:grid-cols-4`)
- Row 1: Vacancy Rate · Avg Rent · 5-Yr Mortgage · Population Growth
- Row 2: Avg Detached Price · **Price-to-Income (new)** · **Rent-to-Income (new)** · Rent Change YoY
- New cards show benchmark in subtext: `"benchmark saudável: 5×"` and `"limite crítico: 30%"`
- Subtext color: red (`text-rose-400`) when above threshold

### 2. Trends page — new tab (`TrendsPage.tsx`)

Add `AffordabilityTab` component as 4th tab. Three charts:

**Chart A — Price-to-Income over time**
- `LineChart` with single line (Toronto CMA)
- Reference line at `y=5` with label "benchmark 5×" in green
- Y-axis: multiplier (e.g. `15.4×`)
- Color: rose

**Chart B — Rent-to-Income over time**
- `LineChart` with single line
- Reference line at `y=30` with label "limite 30%" in amber
- Y-axis: percentage
- Color: pink

**Chart C — Supply Gap**
- `ComposedChart` with two `Area` components stacked visually:
  - Area 1 (base): housing starts, indigo fill + solid stroke
  - Area 2 (demand): estimated demand, transparent fill + rose dashed stroke
  - The visual gap between the two lines conveys the deficit — no manual SVG needed
- `ReferenceLine` with label showing the gap value in the most recent year
- Annotation showing gap in most recent year (e.g. `"gap ≈ 28k units"`)

### 3. Market page (`MarketPage.tsx`)

Add SNLR chart below the mortgage rates chart:

**Chart — SNLR over time**
- `ComposedChart` with `ReferenceArea` bands:
  - Rose band `y > 60`: seller's market
  - Amber band `40–60`: balanced
  - Green band `y < 40`: buyer's market
- Single `Line` for SNLR values
- Legend explains zones
- Data from new `GET /api/v1/market/activity` endpoint

### 4. API service (`services/api.ts`)

Add:
```ts
getAffordability(): Promise<AffordabilityData[]>
getMarketActivity(): Promise<MarketActivityData[]>
```

---

## Error Handling

- All new API calls use `.catch(() => [])` pattern (same as existing charts)
- If `MedianIncome` table has no data for a year, that year is excluded from the series
- SNLR chart shows empty state if `MarketActivity` has no rows

---

## Testing

- Unit tests for `AffordabilityService`: verify ratio calculations with known inputs
- Unit test for `MarketActivity`: verify SNLR = `totalSales / newListings * 100`
- Frontend: no new tests needed (same component patterns as existing charts)

---

## Out of Scope

- Neighborhood-level affordability breakdown
- Condo-specific rent-to-income (uses 2-bedroom blended rate)
- Monthly granularity for SNLR (annual only, matching existing data cadence)
- Asking rent vs in-place rent gap (requires different data source)
