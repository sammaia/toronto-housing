# Affordability KPIs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Price-to-Income, Rent-to-Income, Supply Gap, and SNLR indicators to the dashboard — new KPI cards on Overview, an Affordability tab in Trends, and an SNLR chart in Market.

**Architecture:** Two new Prisma models (`MedianIncome`, `MarketActivity`) seeded with static historical data; a new `AffordabilityModule` with a single endpoint that joins income + rental + price + starts data and returns derived ratios; `OverviewService` and `MarketService` extended to serve the new KPIs; three frontend pages updated to consume them.

**Tech Stack:** NestJS, Prisma, PostgreSQL (Neon), React, Recharts, TypeScript

---

## File Map

**Backend — new files**
- `backend/src/modules/affordability/affordability.service.ts`
- `backend/src/modules/affordability/affordability.service.spec.ts`
- `backend/src/modules/affordability/affordability.controller.ts`
- `backend/src/modules/affordability/affordability.module.ts`
- `backend/src/modules/market/market.service.spec.ts`
- `backend/src/modules/overview/overview.service.spec.ts`

**Backend — modified files**
- `backend/prisma/schema.prisma` — add `MedianIncome`, `MarketActivity` models
- `backend/prisma/seed.ts` — seed data for both new tables
- `backend/src/modules/market/market.service.ts` — add `getMarketActivity()`
- `backend/src/modules/market/market.controller.ts` — add `GET /market/activity`
- `backend/src/modules/overview/overview.service.ts` — add `rentToIncome`, `priceToIncome`
- `backend/src/app.module.ts` — register `AffordabilityModule`

**Frontend — modified files**
- `frontend/src/services/api.ts` — new types + `getAffordability()`, `getMarketActivity()`
- `frontend/src/pages/DashboardPage.tsx` — 2-row KPI grid with 2 new cards
- `frontend/src/pages/TrendsPage.tsx` — `AffordabilityTab` component + new tab
- `frontend/src/pages/MarketPage.tsx` — SNLR chart with zone bands

---

## Task 1: Add Prisma models, migration, and seed data

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/prisma/seed.ts`

- [ ] **Step 1: Add models to schema**

Append to `backend/prisma/schema.prisma`:

```prisma
model MedianIncome {
  id                    Int    @id @default(autoincrement())
  year                  Int
  region                String
  medianHouseholdIncome Int    @map("median_household_income")

  @@unique([year, region])
  @@map("median_incomes")
}

model MarketActivity {
  id          Int   @id @default(autoincrement())
  year        Int   @unique
  totalSales  Int   @map("total_sales")
  newListings Int   @map("new_listings")
  snlr        Float

  @@map("market_activity")
}
```

- [ ] **Step 2: Run migration**

```bash
cd backend && npx prisma migrate dev --name add_median_income_market_activity
```

Expected: `The following migration(s) have been created and applied from new schema changes: migrations/..._add_median_income_market_activity`

- [ ] **Step 3: Add seed data to seed.ts**

Find the end of the `main()` function (before `prisma.$disconnect()`) in `backend/prisma/seed.ts` and add:

```typescript
  console.log('Seeding median incomes...');
  await prisma.medianIncome.createMany({
    data: [
      { year: 2018, region: 'toronto_cma', medianHouseholdIncome: 82000 },
      { year: 2019, region: 'toronto_cma', medianHouseholdIncome: 84500 },
      { year: 2020, region: 'toronto_cma', medianHouseholdIncome: 85000 },
      { year: 2021, region: 'toronto_cma', medianHouseholdIncome: 87000 },
      { year: 2022, region: 'toronto_cma', medianHouseholdIncome: 90000 },
      { year: 2023, region: 'toronto_cma', medianHouseholdIncome: 93000 },
      { year: 2024, region: 'toronto_cma', medianHouseholdIncome: 96000 },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding market activity (SNLR)...');
  await prisma.marketActivity.createMany({
    data: [
      { year: 2018, totalSales: 77426,  newListings: 155823, snlr: 49.7 },
      { year: 2019, totalSales: 87825,  newListings: 152693, snlr: 57.5 },
      { year: 2020, totalSales: 95151,  newListings: 153022, snlr: 62.2 },
      { year: 2021, totalSales: 121712, newListings: 175566, snlr: 69.3 },
      { year: 2022, totalSales: 75140,  newListings: 184513, snlr: 40.7 },
      { year: 2023, totalSales: 65982,  newListings: 166600, snlr: 39.6 },
      { year: 2024, totalSales: 67610,  newListings: 172678, snlr: 39.1 },
    ],
    skipDuplicates: true,
  });
```

- [ ] **Step 4: Run seed**

```bash
cd backend && npx prisma db seed
```

Expected: lines `Seeding median incomes...` and `Seeding market activity (SNLR)...` in output, no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/seed.ts backend/prisma/migrations/
git commit -m "feat: add MedianIncome and MarketActivity prisma models + seed data"
```

---

## Task 2: AffordabilityService with tests

**Files:**
- Create: `backend/src/modules/affordability/affordability.service.ts`
- Create: `backend/src/modules/affordability/affordability.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/modules/affordability/affordability.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { AffordabilityService } from './affordability.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('AffordabilityService', () => {
  let service: AffordabilityService;

  const mockPrisma = {
    medianIncome: { findMany: jest.fn() },
    rentalPrice: { findMany: jest.fn() },
    homePrice: { findMany: jest.fn() },
    housingStart: { groupBy: jest.fn() },
    populationGrowth: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AffordabilityService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AffordabilityService);
    jest.clearAllMocks();
  });

  it('calculates rentToIncome as (avgRent * 12 / medianIncome) * 100', async () => {
    mockPrisma.medianIncome.findMany.mockResolvedValue([
      { year: 2024, region: 'toronto_cma', medianHouseholdIncome: 96000 },
    ]);
    mockPrisma.rentalPrice.findMany.mockResolvedValue([
      { year: 2024, geography: 'Toronto CMA', bedroomType: '2 Bedroom', averageRent: 2740 },
    ]);
    mockPrisma.homePrice.findMany.mockResolvedValue([
      { year: 2024, propertyType: 'detached', avgPrice: 1480000 },
    ]);
    mockPrisma.housingStart.groupBy.mockResolvedValue([
      { year: 2024, _sum: { units: 42300 } },
    ]);
    mockPrisma.populationGrowth.findMany.mockResolvedValue([
      { year: 2024, region: 'toronto_cma', population: 6800000, yoyGrowthPct: 2.6 },
    ]);

    const result = await service.getAffordabilityTimeSeries();

    expect(result).toHaveLength(1);
    // (2740 * 12) / 96000 * 100 = 34.25 → rounds to 34.3
    expect(result[0].rentToIncome).toBeCloseTo(34.3, 0);
  });

  it('calculates priceToIncome as avgDetachedPrice / medianIncome', async () => {
    mockPrisma.medianIncome.findMany.mockResolvedValue([
      { year: 2024, region: 'toronto_cma', medianHouseholdIncome: 96000 },
    ]);
    mockPrisma.rentalPrice.findMany.mockResolvedValue([
      { year: 2024, geography: 'Toronto CMA', bedroomType: '2 Bedroom', averageRent: 2740 },
    ]);
    mockPrisma.homePrice.findMany.mockResolvedValue([
      { year: 2024, propertyType: 'detached', avgPrice: 1480000 },
    ]);
    mockPrisma.housingStart.groupBy.mockResolvedValue([
      { year: 2024, _sum: { units: 42300 } },
    ]);
    mockPrisma.populationGrowth.findMany.mockResolvedValue([
      { year: 2024, region: 'toronto_cma', population: 6800000, yoyGrowthPct: 2.6 },
    ]);

    const result = await service.getAffordabilityTimeSeries();

    // 1480000 / 96000 = 15.42 → 15.4
    expect(result[0].priceToIncome).toBeCloseTo(15.4, 0);
  });

  it('calculates supplyGap as estimatedDemand - housingStarts', async () => {
    mockPrisma.medianIncome.findMany.mockResolvedValue([
      { year: 2024, region: 'toronto_cma', medianHouseholdIncome: 96000 },
    ]);
    mockPrisma.rentalPrice.findMany.mockResolvedValue([
      { year: 2024, geography: 'Toronto CMA', bedroomType: '2 Bedroom', averageRent: 2740 },
    ]);
    mockPrisma.homePrice.findMany.mockResolvedValue([
      { year: 2024, propertyType: 'detached', avgPrice: 1480000 },
    ]);
    // population 6,800,000 * 2.6% / 2.5 = 70,720 estimated demand
    mockPrisma.housingStart.groupBy.mockResolvedValue([
      { year: 2024, _sum: { units: 42300 } },
    ]);
    mockPrisma.populationGrowth.findMany.mockResolvedValue([
      { year: 2024, region: 'toronto_cma', population: 6800000, yoyGrowthPct: 2.6 },
    ]);

    const result = await service.getAffordabilityTimeSeries();

    // estimatedDemand = round(6800000 * 0.026 / 2.5) = round(70720) = 70720
    // supplyGap = 70720 - 42300 = 28420
    expect(result[0].estimatedDemand).toBe(70720);
    expect(result[0].supplyGap).toBe(28420);
  });

  it('excludes years with no income data', async () => {
    mockPrisma.medianIncome.findMany.mockResolvedValue([]);
    mockPrisma.rentalPrice.findMany.mockResolvedValue([
      { year: 2024, geography: 'Toronto CMA', bedroomType: '2 Bedroom', averageRent: 2740 },
    ]);
    mockPrisma.homePrice.findMany.mockResolvedValue([
      { year: 2024, propertyType: 'detached', avgPrice: 1480000 },
    ]);
    mockPrisma.housingStart.groupBy.mockResolvedValue([]);
    mockPrisma.populationGrowth.findMany.mockResolvedValue([]);

    const result = await service.getAffordabilityTimeSeries();

    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd backend && npx jest affordability.service.spec --no-coverage 2>&1 | tail -5
```

Expected: `Cannot find module './affordability.service.js'`

- [ ] **Step 3: Implement AffordabilityService**

Create `backend/src/modules/affordability/affordability.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface AffordabilityRow {
  year: number;
  medianIncome: number;
  avgRent2Bed: number;
  avgDetachedPrice: number;
  rentToIncome: number;
  priceToIncome: number;
  housingStarts: number;
  estimatedDemand: number;
  supplyGap: number;
}

@Injectable()
export class AffordabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getAffordabilityTimeSeries(): Promise<AffordabilityRow[]> {
    const [incomes, rentals, prices, startsGrouped, populations] = await Promise.all([
      this.prisma.medianIncome.findMany({
        where: { region: 'toronto_cma' },
        orderBy: { year: 'asc' },
      }),
      this.prisma.rentalPrice.findMany({
        where: { geography: 'Toronto CMA', bedroomType: '2 Bedroom' },
        orderBy: { year: 'asc' },
      }),
      this.prisma.homePrice.findMany({
        where: { propertyType: 'detached' },
        orderBy: { year: 'asc' },
      }),
      this.prisma.housingStart.groupBy({
        by: ['year'],
        where: { geography: 'Toronto CMA' },
        _sum: { units: true },
        orderBy: { year: 'asc' },
      }),
      this.prisma.populationGrowth.findMany({
        where: { region: 'toronto_cma' },
        orderBy: { year: 'asc' },
      }),
    ]);

    const rentalByYear = new Map(rentals.map((r) => [r.year, r.averageRent]));
    const priceByYear = new Map(prices.map((p) => [p.year, p.avgPrice]));
    const startsByYear = new Map(startsGrouped.map((s) => [s.year, s._sum.units ?? 0]));
    const popByYear = new Map(populations.map((p) => [p.year, p]));

    return incomes
      .filter((inc) => rentalByYear.has(inc.year) && priceByYear.has(inc.year))
      .map((inc) => {
        const avgRent = rentalByYear.get(inc.year)!;
        const avgPrice = priceByYear.get(inc.year)!;
        const starts = startsByYear.get(inc.year) ?? 0;
        const pop = popByYear.get(inc.year);

        const estimatedDemand = pop
          ? Math.round((pop.population * (pop.yoyGrowthPct / 100)) / 2.5)
          : 0;

        return {
          year: inc.year,
          medianIncome: inc.medianHouseholdIncome,
          avgRent2Bed: avgRent,
          avgDetachedPrice: avgPrice,
          rentToIncome: parseFloat(((avgRent * 12) / inc.medianHouseholdIncome * 100).toFixed(1)),
          priceToIncome: parseFloat((avgPrice / inc.medianHouseholdIncome).toFixed(1)),
          housingStarts: starts,
          estimatedDemand,
          supplyGap: estimatedDemand - starts,
        };
      });
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd backend && npx jest affordability.service.spec --no-coverage 2>&1 | tail -5
```

Expected: `Tests: 4 passed, 4 total`

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/affordability/
git commit -m "feat: add AffordabilityService with ratio calculations"
```

---

## Task 3: AffordabilityController, module, and app registration

**Files:**
- Create: `backend/src/modules/affordability/affordability.controller.ts`
- Create: `backend/src/modules/affordability/affordability.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Create controller**

Create `backend/src/modules/affordability/affordability.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { AffordabilityService } from './affordability.service.js';

@Controller('api/v1/affordability')
export class AffordabilityController {
  constructor(private readonly affordabilityService: AffordabilityService) {}

  @Get()
  getTimeSeries() {
    return this.affordabilityService.getAffordabilityTimeSeries();
  }
}
```

- [ ] **Step 2: Create module**

Create `backend/src/modules/affordability/affordability.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { AffordabilityController } from './affordability.controller.js';
import { AffordabilityService } from './affordability.service.js';

@Module({
  controllers: [AffordabilityController],
  providers: [AffordabilityService],
})
export class AffordabilityModule {}
```

- [ ] **Step 3: Register in AppModule**

In `backend/src/app.module.ts`, add the import and registration:

```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { VacancyModule } from './modules/vacancy/vacancy.module.js';
import { RentalModule } from './modules/rental/rental.module.js';
import { HousingStartsModule } from './modules/housing-starts/housing-starts.module.js';
import { MarketModule } from './modules/market/market.module.js';
import { OverviewModule } from './modules/overview/overview.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { DataSyncModule } from './modules/data-sync/data-sync.module.js';
import { AffordabilityModule } from './modules/affordability/affordability.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    VacancyModule,
    RentalModule,
    HousingStartsModule,
    MarketModule,
    OverviewModule,
    ChatModule,
    DataSyncModule,
    AffordabilityModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 4: Smoke-test the endpoint**

Wait for `tsc` watch to recompile, then:

```bash
curl -s http://localhost:3001/api/v1/affordability | python3 -m json.tool | head -20
```

Expected: JSON array with fields `year`, `rentToIncome`, `priceToIncome`, `supplyGap`, etc.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/affordability/ backend/src/app.module.ts
git commit -m "feat: add AffordabilityController and register module"
```

---

## Task 4: MarketService — SNLR endpoint with tests

**Files:**
- Create: `backend/src/modules/market/market.service.spec.ts`
- Modify: `backend/src/modules/market/market.service.ts`
- Modify: `backend/src/modules/market/market.controller.ts`

- [ ] **Step 1: Write failing test**

Create `backend/src/modules/market/market.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { MarketService } from './market.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('MarketService.getMarketActivity', () => {
  let service: MarketService;

  const mockPrisma = {
    homePrice: { findMany: jest.fn() },
    mortgageRate: { findMany: jest.fn() },
    populationGrowth: { findMany: jest.fn() },
    immigration: { findMany: jest.fn() },
    marketActivity: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MarketService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(MarketService);
    jest.clearAllMocks();
  });

  it('returns market activity rows ordered by year', async () => {
    mockPrisma.marketActivity.findMany.mockResolvedValue([
      { year: 2022, totalSales: 75140, newListings: 184513, snlr: 40.7 },
      { year: 2023, totalSales: 65982, newListings: 166600, snlr: 39.6 },
    ]);

    const result = await service.getMarketActivity();

    expect(result).toEqual([
      { year: 2022, totalSales: 75140, newListings: 184513, snlr: 40.7 },
      { year: 2023, totalSales: 65982, newListings: 166600, snlr: 39.6 },
    ]);
    expect(mockPrisma.marketActivity.findMany).toHaveBeenCalledWith({
      orderBy: { year: 'asc' },
    });
  });

  it('returns empty array when no activity data exists', async () => {
    mockPrisma.marketActivity.findMany.mockResolvedValue([]);

    const result = await service.getMarketActivity();

    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd backend && npx jest market.service.spec --no-coverage 2>&1 | tail -5
```

Expected: `TypeError: service.getMarketActivity is not a function`

- [ ] **Step 3: Add getMarketActivity to MarketService**

In `backend/src/modules/market/market.service.ts`, add after `getImmigration()`:

```typescript
  async getMarketActivity() {
    return this.prisma.marketActivity.findMany({ orderBy: { year: 'asc' } });
  }
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd backend && npx jest market.service.spec --no-coverage 2>&1 | tail -5
```

Expected: `Tests: 2 passed, 2 total`

- [ ] **Step 5: Add route to MarketController**

In `backend/src/modules/market/market.controller.ts`, add after `getImmigration()`:

```typescript
  @Get('activity')
  getMarketActivity() {
    return this.marketService.getMarketActivity();
  }
```

- [ ] **Step 6: Smoke-test**

```bash
curl -s http://localhost:3001/api/v1/market/activity | python3 -m json.tool
```

Expected: JSON array with `year`, `totalSales`, `newListings`, `snlr` fields.

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/market/
git commit -m "feat: add getMarketActivity (SNLR) to MarketService and controller"
```

---

## Task 5: Extend OverviewService with affordability KPIs

**Files:**
- Create: `backend/src/modules/overview/overview.service.spec.ts`
- Modify: `backend/src/modules/overview/overview.service.ts`

- [ ] **Step 1: Write failing test**

Create `backend/src/modules/overview/overview.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { OverviewService } from './overview.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('OverviewService.getKpis', () => {
  let service: OverviewService;

  const mockPrisma = {
    vacancyRate: { findFirst: jest.fn() },
    rentalPrice: { findFirst: jest.fn() },
    mortgageRate: { findFirst: jest.fn() },
    homePrice: { findFirst: jest.fn() },
    populationGrowth: { findFirst: jest.fn() },
    immigration: { findFirst: jest.fn() },
    medianIncome: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OverviewService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(OverviewService);

    // Default happy-path stubs for fields not under test
    mockPrisma.vacancyRate.findFirst.mockResolvedValue({ vacancyRate: 1.5 });
    mockPrisma.mortgageRate.findFirst.mockResolvedValue({ avg5yrFixedRate: 5.25, bankOfCanadaPolicyRate: 4.75 });
    mockPrisma.homePrice.findFirst.mockResolvedValue({ avgPrice: 1480000 });
    mockPrisma.populationGrowth.findFirst.mockResolvedValue({ population: 6800000, yoyGrowthPct: 2.6 });
    mockPrisma.immigration.findFirst.mockResolvedValue({ newPermanentResidents: 141500 });
  });

  afterEach(() => jest.clearAllMocks());

  it('includes rentToIncome in KPI response', async () => {
    mockPrisma.rentalPrice.findFirst.mockResolvedValue({ averageRent: 2740, percentageChange: 4.2 });
    mockPrisma.medianIncome.findFirst.mockResolvedValue({ medianHouseholdIncome: 96000 });

    const result = await service.getKpis();

    // (2740 * 12) / 96000 * 100 = 34.25 → 34.3
    expect(result.rentToIncome).toBeCloseTo(34.3, 0);
  });

  it('includes priceToIncome in KPI response', async () => {
    mockPrisma.rentalPrice.findFirst.mockResolvedValue({ averageRent: 2740, percentageChange: 4.2 });
    mockPrisma.medianIncome.findFirst.mockResolvedValue({ medianHouseholdIncome: 96000 });

    const result = await service.getKpis();

    // 1480000 / 96000 = 15.4
    expect(result.priceToIncome).toBeCloseTo(15.4, 0);
  });

  it('returns null for ratios when medianIncome is missing', async () => {
    mockPrisma.rentalPrice.findFirst.mockResolvedValue({ averageRent: 2740, percentageChange: 4.2 });
    mockPrisma.medianIncome.findFirst.mockResolvedValue(null);

    const result = await service.getKpis();

    expect(result.rentToIncome).toBeNull();
    expect(result.priceToIncome).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd backend && npx jest overview.service.spec --no-coverage 2>&1 | tail -5
```

Expected: `expect(received).toBeCloseTo(expected)` — `rentToIncome` is `undefined`

- [ ] **Step 3: Update OverviewService**

Replace the full content of `backend/src/modules/overview/overview.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis() {
    const latestYear = 2024;

    const [vacancyRate, avgRent, mortgageRate, avgHomePrice, population, immigration, medianIncome] =
      await Promise.all([
        this.prisma.vacancyRate.findFirst({
          where: { year: latestYear, geography: 'Toronto CMA', bedroomType: 'Total' },
        }),
        this.prisma.rentalPrice.findFirst({
          where: { year: latestYear, geography: 'Toronto CMA', bedroomType: '2 Bedroom' },
        }),
        this.prisma.mortgageRate.findFirst({
          where: { year: latestYear },
        }),
        this.prisma.homePrice.findFirst({
          where: { year: latestYear, propertyType: 'detached' },
        }),
        this.prisma.populationGrowth.findFirst({
          where: { year: latestYear, region: 'toronto_cma' },
        }),
        this.prisma.immigration.findFirst({
          where: { year: latestYear },
        }),
        this.prisma.medianIncome.findFirst({
          where: { year: latestYear, region: 'toronto_cma' },
        }),
      ]);

    const rentToIncome =
      avgRent && medianIncome
        ? parseFloat(((avgRent.averageRent * 12) / medianIncome.medianHouseholdIncome * 100).toFixed(1))
        : null;

    const priceToIncome =
      avgHomePrice && medianIncome
        ? parseFloat((avgHomePrice.avgPrice / medianIncome.medianHouseholdIncome).toFixed(1))
        : null;

    return {
      vacancyRate: vacancyRate?.vacancyRate ?? null,
      avgRent2Bed: avgRent?.averageRent ?? null,
      rentChange: avgRent?.percentageChange ?? null,
      mortgageRate5yr: mortgageRate?.avg5yrFixedRate ?? null,
      policyRate: mortgageRate?.bankOfCanadaPolicyRate ?? null,
      avgDetachedPrice: avgHomePrice?.avgPrice ?? null,
      population: population?.population ?? null,
      populationGrowth: population?.yoyGrowthPct ?? null,
      newPermanentResidents: immigration?.newPermanentResidents ?? null,
      rentToIncome,
      priceToIncome,
      year: latestYear,
    };
  }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd backend && npx jest overview.service.spec --no-coverage 2>&1 | tail -5
```

Expected: `Tests: 3 passed, 3 total`

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/overview/
git commit -m "feat: add rentToIncome and priceToIncome to overview KPIs"
```

---

## Task 6: Frontend API types and service functions

**Files:**
- Modify: `frontend/src/services/api.ts`

- [ ] **Step 1: Add new interfaces and update KpiData**

In `frontend/src/services/api.ts`:

1. Update `KpiData` to include the two new fields (add after `year: number`):

```typescript
export interface KpiData {
  vacancyRate: number;
  avgRent2Bed: number;
  rentChange: number;
  mortgageRate5yr: number;
  policyRate: number;
  avgDetachedPrice: number;
  population: number;
  populationGrowth: number;
  newPermanentResidents: number;
  rentToIncome: number | null;
  priceToIncome: number | null;
  year: number;
}
```

2. Add two new interfaces after `ImmigrationData`:

```typescript
export interface AffordabilityData {
  year: number;
  medianIncome: number;
  avgRent2Bed: number;
  avgDetachedPrice: number;
  rentToIncome: number;
  priceToIncome: number;
  housingStarts: number;
  estimatedDemand: number;
  supplyGap: number;
}

export interface MarketActivityData {
  year: number;
  totalSales: number;
  newListings: number;
  snlr: number;
}
```

3. Add two new functions at the end of the `// ─── Market ───` section:

```typescript
export async function getAffordability(): Promise<AffordabilityData[]> {
  const { data } = await api.get<AffordabilityData[]>('/affordability');
  return data;
}

export async function getMarketActivity(): Promise<MarketActivityData[]> {
  const { data } = await api.get<MarketActivityData[]>('/market/activity');
  return data;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output (no errors)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/api.ts
git commit -m "feat: add AffordabilityData, MarketActivityData types and API functions"
```

---

## Task 7: DashboardPage — 2-row KPI grid with new cards

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Update KpiData import and KPI cards array**

In `frontend/src/pages/DashboardPage.tsx`:

1. The `KpiData` import from `@/services/api` already picks up the updated interface — no import change needed.

2. Replace the `kpiCards` computation (the `kpis ? [...]` array) with:

```typescript
  const kpiCards: KpiCardProps[] = kpis
    ? [
        // Row 1: Rental & rates
        {
          label: 'Vacancy Rate',
          value: `${kpis.vacancyRate.toFixed(1)}%`,
          subtext: 'Toronto CMA total',
          trend: 'neutral',
          icon: Percent,
          accentColor: COLOR_SEQUENCE[0],
        },
        {
          label: 'Avg Rent (2-Bed)',
          value: formatCurrency(kpis.avgRent2Bed),
          subtext:
            kpis.rentChange > 0
              ? `+${kpis.rentChange.toFixed(1)}% YoY`
              : `${kpis.rentChange.toFixed(1)}% YoY`,
          trend: kpis.rentChange > 0 ? 'up' : 'down',
          icon: DollarSign,
          accentColor: COLOR_SEQUENCE[1],
        },
        {
          label: '5-Yr Mortgage Rate',
          value: `${kpis.mortgageRate5yr.toFixed(2)}%`,
          subtext: `Policy rate ${kpis.policyRate.toFixed(2)}%`,
          trend: 'neutral',
          icon: Building,
          accentColor: COLOR_SEQUENCE[3],
        },
        {
          label: 'Population Growth',
          value: `+${kpis.populationGrowth.toFixed(1)}%`,
          subtext: `${formatNumber(kpis.newPermanentResidents)} new residents`,
          trend: 'up',
          icon: Users,
          accentColor: COLOR_SEQUENCE[5],
        },
        // Row 2: Prices & affordability
        {
          label: 'Avg Detached Price',
          value: formatCurrency(kpis.avgDetachedPrice),
          subtext: `${kpis.year}`,
          trend: 'neutral',
          icon: Home,
          accentColor: COLOR_SEQUENCE[4],
        },
        {
          label: 'Price-to-Income',
          value: kpis.priceToIncome != null ? `${kpis.priceToIncome}×` : '—',
          subtext: 'benchmark saudável: 5×',
          trend: kpis.priceToIncome != null && kpis.priceToIncome > 5 ? 'down' : 'neutral',
          icon: TrendingUp,
          accentColor: '#f43f5e',
        },
        {
          label: 'Rent-to-Income',
          value: kpis.rentToIncome != null ? `${kpis.rentToIncome}%` : '—',
          subtext: 'limite crítico: 30%',
          trend: kpis.rentToIncome != null && kpis.rentToIncome > 30 ? 'down' : 'neutral',
          icon: Percent,
          accentColor: '#ec4899',
        },
        {
          label: 'Rent Change YoY',
          value: `${kpis.rentChange > 0 ? '+' : ''}${kpis.rentChange.toFixed(1)}%`,
          subtext: `As of ${kpis.year}`,
          trend: kpis.rentChange > 0 ? 'up' : 'down',
          icon: TrendingUp,
          accentColor: kpis.rentChange > 0 ? '#10b981' : '#f43f5e',
        },
      ]
    : [];
```

3. Update the KPI grid `className` from `xl:grid-cols-6` to `xl:grid-cols-4` in both the skeleton and the real grid:

```tsx
{/* skeleton */}
<div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
  {Array.from({ length: 8 }).map((_, i) => (
    <Card key={i} className="h-28 animate-pulse bg-muted/30" />
  ))}
</div>

{/* real grid */}
<div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
  {kpiCards.map((card) => (
    <KpiCard key={card.label} {...card} />
  ))}
</div>
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:3000 → Overview page.
Expected: 8 KPI cards in 2 rows of 4. Price-to-Income shows `15.4×` with subtext `benchmark saudável: 5×`. Rent-to-Income shows the ratio with subtext `limite crítico: 30%`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx
git commit -m "feat: add Price-to-Income and Rent-to-Income KPI cards to Overview"
```

---

## Task 8: TrendsPage — AffordabilityTab

**Files:**
- Modify: `frontend/src/pages/TrendsPage.tsx`

- [ ] **Step 1: Add import for new types and API function**

At the top of `frontend/src/pages/TrendsPage.tsx`, add to the existing imports from `@/services/api`:

```typescript
import {
  getVacancyRates,
  getRentalPrices,
  getHousingStartsAnnual,
  getPopulation,
  getImmigration,
  getAffordability,
  type HousingStart,
  type PopulationData,
  type ImmigrationData,
  type AffordabilityData,
} from '@/services/api';
```

Also add `ComposedChart`, `ReferenceLine` to the Recharts import:

```typescript
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
```

- [ ] **Step 2: Add AffordabilityTab component**

Add this component before the `TrendsPage` export (after `DemographicsTab`):

```typescript
// ─── Affordability Tab ───────────────────────────────────────────────────────

function AffordabilityTab() {
  const [data, setData] = useState<AffordabilityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAffordability()
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground">Affordability Analysis</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Income ratios and housing supply gap — Toronto CMA
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {[0, 1].map((i) => <Card key={i} className="h-72 animate-pulse bg-muted/30" />)}
          </div>
          <Card className="h-72 animate-pulse bg-muted/30" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Price-to-Income */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Price-to-Income Ratio</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Anos de renda mediana necessários para comprar um imóvel (Toronto CMA)
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid {...darkGridProps} />
                    <XAxis dataKey="year" {...darkAxisProps} />
                    <YAxis
                      tickFormatter={(v: number) => `${v}×`}
                      domain={[0, 'auto']}
                      {...darkAxisProps}
                    />
                    <Tooltip content={<DarkTooltip formatter={(v) => `${v}×`} />} />
                    <ReferenceLine
                      y={5}
                      stroke="#10b981"
                      strokeDasharray="5 3"
                      label={{ value: 'benchmark 5×', position: 'insideTopLeft', fill: '#10b981', fontSize: 11 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="priceToIncome"
                      name="Price-to-Income"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Rent-to-Income */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Rent-to-Income Ratio</CardTitle>
                <p className="text-xs text-muted-foreground">
                  % da renda mediana anual gasta com aluguel de 2 quartos (Toronto CMA)
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid {...darkGridProps} />
                    <XAxis dataKey="year" {...darkAxisProps} />
                    <YAxis unit="%" {...darkAxisProps} />
                    <Tooltip content={<DarkTooltip formatter={(v) => `${v}%`} />} />
                    <ReferenceLine
                      y={30}
                      stroke="#f59e0b"
                      strokeDasharray="5 3"
                      label={{ value: 'limite 30%', position: 'insideTopLeft', fill: '#f59e0b', fontSize: 11 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rentToIncome"
                      name="Rent-to-Income"
                      stroke="#ec4899"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Supply Gap */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Supply Gap — Housing Starts vs. Demand Estimada</CardTitle>
              <p className="text-xs text-muted-foreground">
                Unidades iniciadas por ano vs. novos domicílios necessários · demanda = crescimento pop. ÷ 2.5 pessoas/domicílio
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid {...darkGridProps} />
                  <XAxis dataKey="year" {...darkAxisProps} />
                  <YAxis
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                    {...darkAxisProps}
                  />
                  <Tooltip
                    content={<DarkTooltip formatter={(v) => formatNumber(v)} />}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
                  <Area
                    type="monotone"
                    dataKey="housingStarts"
                    name="Housing Starts"
                    stroke={COLOR_SEQUENCE[0]}
                    fill={`${COLOR_SEQUENCE[0]}33`}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="estimatedDemand"
                    name="Demanda Estimada"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add the tab to TrendsPage**

In the `TrendsPage` component, update the `TabsList` and add a `TabsContent`:

```tsx
<Tabs defaultValue="rental">
  <TabsList className="mb-2">
    <TabsTrigger value="rental">Rental Market</TabsTrigger>
    <TabsTrigger value="starts">Housing Starts</TabsTrigger>
    <TabsTrigger value="demographics">Demographics</TabsTrigger>
    <TabsTrigger value="affordability">Affordability</TabsTrigger>
  </TabsList>

  <TabsContent value="rental">
    <RentalMarketTab />
  </TabsContent>
  <TabsContent value="starts">
    <HousingStartsTab />
  </TabsContent>
  <TabsContent value="demographics">
    <DemographicsTab />
  </TabsContent>
  <TabsContent value="affordability">
    <AffordabilityTab />
  </TabsContent>
</Tabs>
```

- [ ] **Step 4: Verify in browser**

Open http://localhost:3000/trends → click "Affordability" tab.
Expected: 3 charts — Price-to-Income with green reference line at 5×, Rent-to-Income with amber reference at 30%, Supply Gap with area + dashed demand line.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/TrendsPage.tsx
git commit -m "feat: add Affordability tab with ratio charts and supply gap to Trends page"
```

---

## Task 9: MarketPage — SNLR chart

**Files:**
- Modify: `frontend/src/pages/MarketPage.tsx`

- [ ] **Step 1: Add import for new types and Recharts components**

In `frontend/src/pages/MarketPage.tsx`, update imports:

```typescript
import {
  LineChart,
  Line,
  ComposedChart,
  ReferenceArea,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
```

Add `getMarketActivity` and `MarketActivityData` to the api import:

```typescript
import {
  getHomePrices,
  getMortgageRates,
  getMarketActivity,
  type HomePrice,
  type MortgageRate,
  type MarketActivityData,
} from '@/services/api';
```

- [ ] **Step 2: Add state and fetch**

In the `MarketPage` component, add state and fetch alongside the existing ones:

```typescript
  const [homePrices, setHomePrices] = useState<HomePrice[]>([]);
  const [mortgageRates, setMortgageRates] = useState<MortgageRate[]>([]);
  const [activityData, setActivityData] = useState<MarketActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getHomePrices().catch(() => []),
      getMortgageRates().catch(() => []),
      getMarketActivity().catch(() => []),
    ]).then(([prices, rates, activity]) => {
      setHomePrices(prices);
      setMortgageRates(rates);
      setActivityData(activity);
      setLoading(false);
    });
  }, []);
```

- [ ] **Step 3: Add SNLR chart after mortgage rates chart**

After the closing `</Card>` of the mortgage rates chart, add:

```tsx
          {/* SNLR */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Sales-to-New-Listings Ratio (SNLR)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Indicador de equilíbrio do mercado — abaixo de 40%: mercado do comprador · 40–60%: balanceado · acima de 60%: mercado do vendedor
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={activityData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <ReferenceArea y1={60} y2={100} fill="rgba(244,63,94,0.07)" />
                  <ReferenceArea y1={40} y2={60}  fill="rgba(245,158,11,0.07)" />
                  <ReferenceArea y1={0}  y2={40}  fill="rgba(16,185,129,0.07)" />
                  <CartesianGrid {...darkGridProps} />
                  <XAxis dataKey="year" {...darkAxisProps} />
                  <YAxis unit="%" domain={[0, 80]} {...darkAxisProps} />
                  <Tooltip content={<DarkTooltip formatter={(v) => `${v}%`} />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }} />
                  <Line
                    type="monotone"
                    dataKey="snlr"
                    name="SNLR"
                    stroke={COLOR_SEQUENCE[0]}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 0, fill: COLOR_SEQUENCE[0] }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
```

Also add a loading skeleton for the new chart in the loading state block (find the existing `<Card className="h-72 animate-pulse bg-muted/30" />` and add another after it):

```tsx
<Card className="h-72 animate-pulse bg-muted/30" />
```

- [ ] **Step 4: Verify in browser**

Open http://localhost:3000/market — scroll down past Mortgage Rates.
Expected: SNLR chart with 3 subtle colored zone bands (red at top, amber in middle, green at bottom), line moving from ~50% in 2018 down to ~39% in 2024.

- [ ] **Step 5: Run all backend tests**

```bash
cd backend && npx jest --no-coverage 2>&1 | tail -10
```

Expected: all test suites pass, no failures.

- [ ] **Step 6: Final commit**

```bash
git add frontend/src/pages/MarketPage.tsx
git commit -m "feat: add SNLR chart with market balance zones to Market page"
```
