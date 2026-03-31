# CMHC Data Pipeline + Data Transparency Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automate weekly data ingestion from CMHC, Bank of Canada, and Statistics Canada; display data provenance on a new `/about-data` frontend page.

**Architecture:** `DataSyncModule` added to the NestJS app. `DataSyncService` holds a `@Cron` (Mondays 3am) + `onModuleInit` trigger. Five fetcher services run in parallel via `Promise.allSettled`. A `data_sources` Prisma table tracks `lastSyncedAt`, `lastSyncStatus`, and `errorMessage` per source. `DataSyncController` exposes `GET /api/v1/data-sources` (no auth). Frontend `/about-data` route displays source cards.

**Tech Stack:** `@nestjs/schedule`, `axios`, `adm-zip`, `csv-parse` (existing), Prisma 7, React + TypeScript + React Router v6

---

## File Map

**Created:**
- `backend/src/modules/data-sync/fetchers/data-fetcher.interface.ts`
- `backend/src/modules/data-sync/fetchers/boc-rates.fetcher.ts`
- `backend/src/modules/data-sync/fetchers/boc-rates.fetcher.spec.ts`
- `backend/src/modules/data-sync/fetchers/cmhc-housing-starts.fetcher.ts`
- `backend/src/modules/data-sync/fetchers/cmhc-housing-starts.fetcher.spec.ts`
- `backend/src/modules/data-sync/fetchers/cmhc-vacancy.fetcher.ts`
- `backend/src/modules/data-sync/fetchers/cmhc-rental.fetcher.ts`
- `backend/src/modules/data-sync/fetchers/cmhc-rms.fetcher.spec.ts`
- `backend/src/modules/data-sync/fetchers/statcan.fetcher.ts`
- `backend/src/modules/data-sync/fetchers/statcan.fetcher.spec.ts`
- `backend/src/modules/data-sync/data-sync.service.ts`
- `backend/src/modules/data-sync/data-sync.service.spec.ts`
- `backend/src/modules/data-sync/data-sync.controller.ts`
- `backend/src/modules/data-sync/data-sync.module.ts`
- `frontend/src/components/DataSourceCard.tsx`
- `frontend/src/pages/AboutDataPage.tsx`

**Modified:**
- `backend/prisma/schema.prisma` — add `DataSource` model
- `backend/prisma/seed.ts` — seed `DataSource` records
- `backend/src/app.module.ts` — register `ScheduleModule` + `DataSyncModule`
- `frontend/src/services/api.ts` — add `DataSource` type + `getDataSources()`
- `frontend/src/App.tsx` — add `/about-data` route
- `frontend/src/components/layout/Sidebar.tsx` — add nav item

---

### Task 1: Install backend dependencies

**Files:**
- Modify: `backend/package.json` (via npm install)

- [ ] **Step 1: Install runtime packages**

```bash
cd backend && npm install @nestjs/schedule axios adm-zip
```

- [ ] **Step 2: Install type definitions**

```bash
cd backend && npm install -D @types/adm-zip
```

- [ ] **Step 3: Verify installs**

```bash
cd backend && node -e "require('@nestjs/schedule'); require('axios'); require('adm-zip'); console.log('OK')"
```

Expected output: `OK`

- [ ] **Step 4: Commit**

```bash
cd backend && git add package.json package-lock.json
git commit -m "chore: add @nestjs/schedule, axios, adm-zip to backend"
```

---

### Task 2: Add DataSource Prisma model + migration

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Add model to schema**

Append at the end of `backend/prisma/schema.prisma`:

```prisma
model DataSource {
  id             Int       @id @default(autoincrement())
  key            String    @unique
  name           String
  description    String
  url            String
  lastSyncedAt   DateTime? @map("last_synced_at")
  lastSyncStatus String    @default("pending") @map("last_sync_status")
  errorMessage   String?   @map("error_message")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  @@map("data_sources")
}
```

- [ ] **Step 2: Run migration**

```bash
cd backend && npx prisma migrate dev --name add_data_sources
```

Expected: migration file created in `backend/prisma/migrations/`, Prisma client regenerated.

- [ ] **Step 3: Verify the table was created**

```bash
cd backend && npx prisma studio
```

Open the browser preview. Confirm `data_sources` table exists with the correct columns. Close Prisma Studio when done.

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat: add data_sources table to schema"
```

---

### Task 3: Seed DataSource records

**Files:**
- Modify: `backend/prisma/seed.ts`

- [ ] **Step 1: Add DataSource seed at the end of main() in seed.ts**

Add after the existing `console.log('Seed complete!')` line, replacing it:

```typescript
  console.log('Seeding data sources...');
  const sources = [
    {
      key: 'cmhc_vacancy',
      name: 'CMHC Rental Market Survey — Vacancy Rates',
      description: 'Annual vacancy rates by bedroom type for Toronto CMA and Ontario, from the CMHC Rental Market Survey (RMS), published each November.',
      url: 'https://www.cmhc-schl.gc.ca/en/data-and-research/data-tables/rental-market-report',
      lastSyncStatus: 'pending',
    },
    {
      key: 'cmhc_rental',
      name: 'CMHC Rental Market Survey — Average Rents',
      description: 'Average monthly rents by bedroom type for Toronto CMA and Ontario, from the CMHC Rental Market Survey (RMS), published each November.',
      url: 'https://www.cmhc-schl.gc.ca/en/data-and-research/data-tables/rental-market-report',
      lastSyncStatus: 'pending',
    },
    {
      key: 'cmhc_housing_starts',
      name: 'CMHC Housing Now — Housing Starts',
      description: 'Monthly housing starts by dwelling type for Toronto CMA, from the CMHC Housing Now publication. Updated monthly.',
      url: 'https://www.cmhc-schl.gc.ca/en/data-and-research/data-tables/housing-starts-under-construction-completions',
      lastSyncStatus: 'pending',
    },
    {
      key: 'boc_rates',
      name: 'Bank of Canada — Interest Rates',
      description: 'Annual averages of the Bank Rate (policy rate proxy) and 5-year conventional mortgage rate, from the Bank of Canada Valet API.',
      url: 'https://www.bankofcanada.ca/rates/interest-rates/',
      lastSyncStatus: 'pending',
    },
    {
      key: 'statcan_population',
      name: 'Statistics Canada — Population & Immigration',
      description: 'Annual Ontario population estimates (table 17-10-0005-01) and national immigration components (table 17-10-0040-01), from Statistics Canada.',
      url: 'https://www150.statcan.gc.ca/n1/en/subjects/population_and_demography',
      lastSyncStatus: 'pending',
    },
    {
      key: 'trreb_home_prices',
      name: 'TRREB Market Watch — Home Prices',
      description: 'Average home prices by property type in Toronto. Updated manually — TRREB does not offer a public API.',
      url: 'https://trreb.ca/index.php/market-news/market-watch',
      lastSyncStatus: 'manual',
    },
  ];

  for (const source of sources) {
    await prisma.dataSource.upsert({
      where: { key: source.key },
      update: {},
      create: source,
    });
  }

  console.log('Seed complete!');
```

- [ ] **Step 2: Run the seed**

```bash
cd backend && npx prisma db seed
```

Expected: no errors, all seed steps complete.

- [ ] **Step 3: Verify records**

```bash
cd backend && npx prisma studio
```

Confirm `data_sources` table has 6 rows. `trreb_home_prices` has `lastSyncStatus = 'manual'`, others have `'pending'`.

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/seed.ts
git commit -m "feat: seed data_sources table with 6 source records"
```

---

### Task 4: DataFetcher interface + DataSyncModule + DataSyncController

**Files:**
- Create: `backend/src/modules/data-sync/fetchers/data-fetcher.interface.ts`
- Create: `backend/src/modules/data-sync/data-sync.controller.ts`
- Create: `backend/src/modules/data-sync/data-sync.module.ts`

- [ ] **Step 1: Write failing test for the controller**

Create `backend/src/modules/data-sync/data-sync.controller.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { DataSyncController } from './data-sync.controller.js';
import { DataSyncService } from './data-sync.service.js';

describe('DataSyncController', () => {
  let controller: DataSyncController;
  const mockService = {
    findAllSources: jest.fn().mockResolvedValue([
      { key: 'boc_rates', name: 'Bank of Canada', lastSyncStatus: 'success' },
    ]),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [DataSyncController],
      providers: [{ provide: DataSyncService, useValue: mockService }],
    }).compile();
    controller = module.get(DataSyncController);
  });

  it('returns all data sources', async () => {
    const result = await controller.findAll();
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('boc_rates');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd backend && npm test -- data-sync.controller --no-coverage
```

Expected: FAIL (module not found).

- [ ] **Step 3: Create the DataFetcher interface**

Create `backend/src/modules/data-sync/fetchers/data-fetcher.interface.ts`:

```typescript
export interface DataFetcher {
  readonly sourceKey: string;
  fetch(): Promise<void>;
}
```

- [ ] **Step 4: Create the DataSyncController**

Create `backend/src/modules/data-sync/data-sync.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { DataSyncService } from './data-sync.service.js';

@Controller('data-sources')
export class DataSyncController {
  constructor(private readonly dataSyncService: DataSyncService) {}

  @Get()
  findAll() {
    return this.dataSyncService.findAllSources();
  }
}
```

- [ ] **Step 5: Create the DataSyncService stub**

Create `backend/src/modules/data-sync/data-sync.service.ts`:

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class DataSyncService implements OnModuleInit {
  private readonly logger = new Logger(DataSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Run once on startup in the background — does not block app startup
    setImmediate(() => this.syncAll());
  }

  @Cron('0 3 * * 1') // Every Monday at 3:00 AM
  async syncAll(): Promise<void> {
    this.logger.log('Data sync started');
    // Fetchers wired in Task 9
    this.logger.log('Data sync complete (no fetchers registered yet)');
  }

  async findAllSources() {
    return this.prisma.dataSource.findMany({ orderBy: { key: 'asc' } });
  }
}
```

- [ ] **Step 6: Create the DataSyncModule**

Create `backend/src/modules/data-sync/data-sync.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { DataSyncService } from './data-sync.service.js';
import { DataSyncController } from './data-sync.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [DataSyncService],
  controllers: [DataSyncController],
})
export class DataSyncModule {}
```

- [ ] **Step 7: Run test — expect PASS**

```bash
cd backend && npm test -- data-sync.controller --no-coverage
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/data-sync/
git commit -m "feat: add DataSyncModule skeleton with /data-sources endpoint"
```

---

### Task 5: BocRatesFetcher

**Files:**
- Create: `backend/src/modules/data-sync/fetchers/boc-rates.fetcher.ts`
- Create: `backend/src/modules/data-sync/fetchers/boc-rates.fetcher.spec.ts`

The Bank of Canada Valet API is public and requires no auth key.
- `V39079` = Bank Rate (policy rate, published weekly)
- `V80691311` = Chartered bank 5-year conventional mortgage rate (posted rate, weekly)

- [ ] **Step 1: Write the failing test**

Create `backend/src/modules/data-sync/fetchers/boc-rates.fetcher.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { BocRatesFetcher } from './boc-rates.fetcher.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BocRatesFetcher', () => {
  let fetcher: BocRatesFetcher;
  const mockPrisma = { mortgageRate: { upsert: jest.fn() } };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BocRatesFetcher,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    fetcher = module.get(BocRatesFetcher);
    jest.clearAllMocks();
  });

  it('upserts annual averages from BoC observations', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        observations: [
          { d: '2024-01-17', V39079: { v: '5.00' }, V80691311: { v: '7.20' } },
          { d: '2024-06-05', V39079: { v: '4.75' }, V80691311: { v: '6.90' } },
          { d: '2024-12-11', V39079: { v: '3.25' }, V80691311: { v: '6.24' } },
        ],
      },
    });

    await fetcher.fetch();

    expect(mockPrisma.mortgageRate.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { year: 2024 },
        create: expect.objectContaining({
          year: 2024,
          bankOfCanadaPolicyRate: expect.any(Number),
          avg5yrFixedRate: expect.any(Number),
          avgVariableRate: expect.any(Number),
        }),
      }),
    );
  });

  it('skips observations before 2018', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        observations: [
          { d: '2017-12-06', V39079: { v: '1.00' }, V80691311: { v: '4.89' } },
        ],
      },
    });

    await fetcher.fetch();

    expect(mockPrisma.mortgageRate.upsert).not.toHaveBeenCalled();
  });

  it('skips rows with nan values', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        observations: [
          { d: '2024-01-01', V39079: { v: 'nan' }, V80691311: { v: 'nan' } },
        ],
      },
    });

    await fetcher.fetch();

    expect(mockPrisma.mortgageRate.upsert).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd backend && npm test -- boc-rates --no-coverage
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement BocRatesFetcher**

Create `backend/src/modules/data-sync/fetchers/boc-rates.fetcher.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { DataFetcher } from './data-fetcher.interface.js';

// Bank of Canada Valet API
// V39079  = Bank Rate (policy rate proxy, published weekly)
// V80691311 = Chartered bank 5-yr conventional mortgage rate (weekly)
const BOC_URL =
  'https://www.bankofcanada.ca/valet/observations/V39079,V80691311/json?recent=600';

interface BocObservation {
  d: string; // "2024-11-27"
  V39079?: { v: string };
  V80691311?: { v: string };
}

@Injectable()
export class BocRatesFetcher implements DataFetcher {
  readonly sourceKey = 'boc_rates';
  private readonly logger = new Logger(BocRatesFetcher.name);

  constructor(private readonly prisma: PrismaService) {}

  async fetch(): Promise<void> {
    const { data } = await axios.get<{ observations: BocObservation[] }>(BOC_URL);

    // Aggregate weekly observations into annual averages
    const byYear = new Map<number, { policy: number[]; fixed5yr: number[] }>();
    for (const obs of data.observations) {
      const year = parseInt(obs.d.slice(0, 4), 10);
      if (year < 2018) continue;
      const policyVal = obs.V39079?.v;
      const mortgageVal = obs.V80691311?.v;
      if (!policyVal || policyVal === 'nan' || !mortgageVal || mortgageVal === 'nan') continue;
      if (!byYear.has(year)) byYear.set(year, { policy: [], fixed5yr: [] });
      const entry = byYear.get(year)!;
      entry.policy.push(parseFloat(policyVal));
      entry.fixed5yr.push(parseFloat(mortgageVal));
    }

    const avg = (arr: number[]) =>
      parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));

    for (const [year, { policy, fixed5yr }] of byYear) {
      if (policy.length === 0 || fixed5yr.length === 0) continue;
      const bankOfCanadaPolicyRate = avg(policy);
      const avg5yrFixedRate = avg(fixed5yr);
      // Variable rate approximated as Bank Rate + 1.5% (typical prime-linked spread)
      const avgVariableRate = parseFloat((bankOfCanadaPolicyRate + 1.5).toFixed(2));

      await this.prisma.mortgageRate.upsert({
        where: { year },
        update: { bankOfCanadaPolicyRate, avg5yrFixedRate, avgVariableRate },
        create: { year, bankOfCanadaPolicyRate, avg5yrFixedRate, avgVariableRate },
      });
    }

    this.logger.log(`BocRatesFetcher: synced ${byYear.size} year(s)`);
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd backend && npm test -- boc-rates --no-coverage
```

Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/data-sync/fetchers/boc-rates.fetcher.ts \
        backend/src/modules/data-sync/fetchers/boc-rates.fetcher.spec.ts
git commit -m "feat: add BocRatesFetcher using Bank of Canada Valet API"
```

---

### Task 6: CmhcHousingStartsFetcher

**Files:**
- Create: `backend/src/modules/data-sync/fetchers/cmhc-housing-starts.fetcher.ts`
- Create: `backend/src/modules/data-sync/fetchers/cmhc-housing-starts.fetcher.spec.ts`

CMHC publishes housing starts CSV via the open.canada.ca CKAN API. The fetcher discovers the download URL at runtime using CMHC's dataset package on open.canada.ca.

**Before implementing**, verify the CMHC dataset package name for housing starts:

```bash
curl -s "https://open.canada.ca/data/api/3/action/package_search?q=cmhc+housing+starts+completions&rows=5" \
  | python3 -c "import sys,json; [print(r['name'], '-', r['title']) for r in json.load(sys.stdin)['result']['results']]"
```

Use the package `name` (slug) from the output for `CMHC_STARTS_PACKAGE` below. Expected name pattern: `housing-starts-and-completions` or similar.

- [ ] **Step 1: Write the failing test**

Create `backend/src/modules/data-sync/fetchers/cmhc-housing-starts.fetcher.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { CmhcHousingStartsFetcher } from './cmhc-housing-starts.fetcher.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_CSV = `Year,Month,Survey Zone,Dwelling Type,Housing Starts
2025,1,Toronto CMA,Single,380
2025,1,Toronto CMA,Semi-Detached,71
2025,1,Toronto CMA,Row,195
2025,1,Toronto CMA,Apartment,2750
2017,1,Toronto CMA,Single,300
`;

describe('CmhcHousingStartsFetcher', () => {
  let fetcher: CmhcHousingStartsFetcher;
  const mockPrisma = { housingStart: { upsert: jest.fn() } };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CmhcHousingStartsFetcher,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    fetcher = module.get(CmhcHousingStartsFetcher);
    jest.clearAllMocks();
  });

  it('upserts housing start rows for Toronto CMA from 2018 onward', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          result: { resources: [{ format: 'CSV', url: 'https://example.com/starts.csv' }] },
        },
      })
      .mockResolvedValueOnce({ data: MOCK_CSV });

    await fetcher.fetch();

    expect(mockPrisma.housingStart.upsert).toHaveBeenCalledTimes(4);
    expect(mockPrisma.housingStart.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          year_month_geography_dwellingType: {
            year: 2025,
            month: 1,
            geography: 'Toronto CMA',
            dwellingType: 'Single',
          },
        }),
      }),
    );
  });

  it('skips rows before 2018', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { result: { resources: [{ format: 'CSV', url: 'https://example.com/starts.csv' }] } },
      })
      .mockResolvedValueOnce({ data: MOCK_CSV });

    await fetcher.fetch();

    // Only 4 rows from 2025 — the 2017 row is skipped
    expect(mockPrisma.housingStart.upsert).toHaveBeenCalledTimes(4);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd backend && npm test -- cmhc-housing-starts --no-coverage
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement CmhcHousingStartsFetcher**

Create `backend/src/modules/data-sync/fetchers/cmhc-housing-starts.fetcher.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { DataFetcher } from './data-fetcher.interface.js';

// Update this slug after running the package_search verification step above.
// Find it at: https://open.canada.ca/data/en/dataset?q=cmhc+housing+starts
const CMHC_STARTS_PACKAGE = 'housing-starts-under-construction-and-completions-by-type-of-dwelling';
const CKAN_URL = `https://open.canada.ca/data/api/3/action/package_show?id=${CMHC_STARTS_PACKAGE}`;

@Injectable()
export class CmhcHousingStartsFetcher implements DataFetcher {
  readonly sourceKey = 'cmhc_housing_starts';
  private readonly logger = new Logger(CmhcHousingStartsFetcher.name);

  constructor(private readonly prisma: PrismaService) {}

  async fetch(): Promise<void> {
    // Discover CSV URL dynamically via CKAN API
    const pkg = await axios.get<{ result: { resources: { format: string; url: string }[] } }>(CKAN_URL);
    const csvResource = pkg.data.result.resources.find(
      (r) => r.format?.toUpperCase() === 'CSV',
    );
    if (!csvResource) throw new Error(`No CSV resource found in CMHC package: ${CMHC_STARTS_PACKAGE}`);

    const csvResponse = await axios.get<string>(csvResource.url);
    const rows: Record<string, string>[] = parse(csvResponse.data, {
      columns: true,
      skip_empty_lines: true,
    });

    let upserted = 0;
    for (const row of rows) {
      const year = parseInt(row['Year'] ?? row['year'], 10);
      const month = parseInt(row['Month'] ?? row['month'], 10);
      const geography = row['Survey Zone'] ?? row['Geography'] ?? row['City'] ?? '';
      const dwellingType = row['Dwelling Type'] ?? row['Unit Type'] ?? row['Type'] ?? '';
      const units = parseInt(row['Housing Starts'] ?? row['Starts'] ?? row['Units'] ?? '0', 10);

      if (isNaN(year) || year < 2018) continue;
      if (!geography.includes('Toronto')) continue;
      if (isNaN(month) || isNaN(units)) continue;

      await this.prisma.housingStart.upsert({
        where: { year_month_geography_dwellingType: { year, month, geography: 'Toronto CMA', dwellingType } },
        update: { units },
        create: { year, month, geography: 'Toronto CMA', dwellingType, units },
      });
      upserted++;
    }

    this.logger.log(`CmhcHousingStartsFetcher: upserted ${upserted} rows`);
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd backend && npm test -- cmhc-housing-starts --no-coverage
```

Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/data-sync/fetchers/cmhc-housing-starts.fetcher.ts \
        backend/src/modules/data-sync/fetchers/cmhc-housing-starts.fetcher.spec.ts
git commit -m "feat: add CmhcHousingStartsFetcher via open.canada.ca CKAN API"
```

---

### Task 7: CmhcVacancyFetcher + CmhcRentalFetcher

**Files:**
- Create: `backend/src/modules/data-sync/fetchers/cmhc-vacancy.fetcher.ts`
- Create: `backend/src/modules/data-sync/fetchers/cmhc-rental.fetcher.ts`
- Create: `backend/src/modules/data-sync/fetchers/cmhc-rms.fetcher.spec.ts`

Both fetchers use the same CMHC Rental Market Survey (RMS) CSV. **Before implementing**, verify the dataset package name:

```bash
curl -s "https://open.canada.ca/data/api/3/action/package_search?q=cmhc+rental+market+survey+vacancy&rows=5" \
  | python3 -c "import sys,json; [print(r['name'], '-', r['title']) for r in json.load(sys.stdin)['result']['results']]"
```

Use the resulting slug for `CMHC_RMS_PACKAGE` below.

- [ ] **Step 1: Write failing test for both fetchers**

Create `backend/src/modules/data-sync/fetchers/cmhc-rms.fetcher.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { CmhcVacancyFetcher } from './cmhc-vacancy.fetcher.js';
import { CmhcRentalFetcher } from './cmhc-rental.fetcher.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_RMS_CSV = `Year,Survey Zone,Bedroom Type,Vacancy Rate (%),Average Rent ($),Universe
2025,Toronto CMA,Bachelor,2.1,1450,13200
2025,Toronto CMA,1 Bedroom,2.8,1820,68000
2025,Ontario,2 Bedroom,3.0,1650,190000
2017,Toronto CMA,Bachelor,0.7,1100,12000
`;

function setupMocks() {
  mockedAxios.get
    .mockResolvedValueOnce({
      data: { result: { resources: [{ format: 'CSV', url: 'https://example.com/rms.csv' }] } },
    })
    .mockResolvedValueOnce({ data: MOCK_RMS_CSV });
}

describe('CmhcVacancyFetcher', () => {
  let fetcher: CmhcVacancyFetcher;
  const mockPrisma = { vacancyRate: { upsert: jest.fn() } };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CmhcVacancyFetcher, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    fetcher = module.get(CmhcVacancyFetcher);
    jest.clearAllMocks();
  });

  it('upserts vacancy rates from 2018 onward', async () => {
    setupMocks();
    await fetcher.fetch();
    // 3 rows from 2025 (2017 row skipped)
    expect(mockPrisma.vacancyRate.upsert).toHaveBeenCalledTimes(3);
    expect(mockPrisma.vacancyRate.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          year_geography_bedroomType: { year: 2025, geography: 'Toronto CMA', bedroomType: 'Bachelor' },
        }),
      }),
    );
  });
});

describe('CmhcRentalFetcher', () => {
  let fetcher: CmhcRentalFetcher;
  const mockPrisma = { rentalPrice: { upsert: jest.fn() } };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CmhcRentalFetcher, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    fetcher = module.get(CmhcRentalFetcher);
    jest.clearAllMocks();
  });

  it('upserts rental prices from 2018 onward', async () => {
    setupMocks();
    await fetcher.fetch();
    expect(mockPrisma.rentalPrice.upsert).toHaveBeenCalledTimes(3);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd backend && npm test -- cmhc-rms --no-coverage
```

Expected: FAIL (module not found).

- [ ] **Step 3: Create a shared CSV download helper**

Create `backend/src/modules/data-sync/fetchers/cmhc-rms.fetcher.ts` (shared helper, not a fetcher itself):

```typescript
import axios from 'axios';
import { parse } from 'csv-parse/sync';

// Update after running verification step above
const CMHC_RMS_PACKAGE = 'rental-market-report-data-tables';
const CKAN_URL = `https://open.canada.ca/data/api/3/action/package_show?id=${CMHC_RMS_PACKAGE}`;

export async function downloadRmsCsv(): Promise<Record<string, string>[]> {
  const pkg = await axios.get<{ result: { resources: { format: string; url: string }[] } }>(CKAN_URL);
  const csvResource = pkg.data.result.resources.find(
    (r) => r.format?.toUpperCase() === 'CSV',
  );
  if (!csvResource) throw new Error(`No CSV resource in CMHC RMS package: ${CMHC_RMS_PACKAGE}`);
  const csvResponse = await axios.get<string>(csvResource.url);
  return parse(csvResponse.data, { columns: true, skip_empty_lines: true });
}
```

- [ ] **Step 4: Implement CmhcVacancyFetcher**

Create `backend/src/modules/data-sync/fetchers/cmhc-vacancy.fetcher.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { downloadRmsCsv } from './cmhc-rms.fetcher.js';
import type { DataFetcher } from './data-fetcher.interface.js';

@Injectable()
export class CmhcVacancyFetcher implements DataFetcher {
  readonly sourceKey = 'cmhc_vacancy';
  private readonly logger = new Logger(CmhcVacancyFetcher.name);

  constructor(private readonly prisma: PrismaService) {}

  async fetch(): Promise<void> {
    const rows = await downloadRmsCsv();
    let upserted = 0;

    for (const row of rows) {
      const year = parseInt(row['Year'] ?? row['year'], 10);
      if (isNaN(year) || year < 2018) continue;

      const geography = row['Survey Zone'] ?? row['Geography'] ?? '';
      const bedroomType = row['Bedroom Type'] ?? row['Unit Type'] ?? '';
      const vacancyRate = parseFloat(row['Vacancy Rate (%)'] ?? row['Vacancy Rate'] ?? '');
      const universe = parseInt(row['Universe'] ?? row['Total Units'] ?? '0', 10);

      if (!geography || !bedroomType || isNaN(vacancyRate)) continue;

      await this.prisma.vacancyRate.upsert({
        where: { year_geography_bedroomType: { year, geography, bedroomType } },
        update: { vacancyRate, universe },
        create: { year, geography, bedroomType, vacancyRate, universe },
      });
      upserted++;
    }

    this.logger.log(`CmhcVacancyFetcher: upserted ${upserted} rows`);
  }
}
```

- [ ] **Step 5: Implement CmhcRentalFetcher**

Create `backend/src/modules/data-sync/fetchers/cmhc-rental.fetcher.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { downloadRmsCsv } from './cmhc-rms.fetcher.js';
import type { DataFetcher } from './data-fetcher.interface.js';

@Injectable()
export class CmhcRentalFetcher implements DataFetcher {
  readonly sourceKey = 'cmhc_rental';
  private readonly logger = new Logger(CmhcRentalFetcher.name);

  constructor(private readonly prisma: PrismaService) {}

  async fetch(): Promise<void> {
    const rows = await downloadRmsCsv();
    let upserted = 0;

    for (const row of rows) {
      const year = parseInt(row['Year'] ?? row['year'], 10);
      if (isNaN(year) || year < 2018) continue;

      const geography = row['Survey Zone'] ?? row['Geography'] ?? '';
      const bedroomType = row['Bedroom Type'] ?? row['Unit Type'] ?? '';
      const averageRent = parseFloat(row['Average Rent ($)'] ?? row['Average Rent'] ?? '');
      const percentageChange = parseFloat(
        row['% Change in Average Rent (%)'] ?? row['% Change'] ?? row['Pct Change'] ?? '0',
      );

      if (!geography || !bedroomType || isNaN(averageRent)) continue;

      await this.prisma.rentalPrice.upsert({
        where: { year_geography_bedroomType: { year, geography, bedroomType } },
        update: { averageRent, percentageChange },
        create: { year, geography, bedroomType, averageRent, percentageChange },
      });
      upserted++;
    }

    this.logger.log(`CmhcRentalFetcher: upserted ${upserted} rows`);
  }
}
```

- [ ] **Step 6: Run test — expect PASS**

```bash
cd backend && npm test -- cmhc-rms --no-coverage
```

Expected: 2 passing tests (one for vacancy, one for rental).

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/data-sync/fetchers/cmhc-rms.fetcher.ts \
        backend/src/modules/data-sync/fetchers/cmhc-vacancy.fetcher.ts \
        backend/src/modules/data-sync/fetchers/cmhc-rental.fetcher.ts \
        backend/src/modules/data-sync/fetchers/cmhc-rms.fetcher.spec.ts
git commit -m "feat: add CmhcVacancyFetcher and CmhcRentalFetcher using RMS CSV"
```

---

### Task 8: StatcanFetcher

**Files:**
- Create: `backend/src/modules/data-sync/fetchers/statcan.fetcher.ts`
- Create: `backend/src/modules/data-sync/fetchers/statcan.fetcher.spec.ts`

Statistics Canada provides bulk CSV downloads as ZIP files.
- Population: table `17-10-0005-01` → ZIP at `https://www150.statcan.gc.ca/t1/tbl1/en/dtbl!17100005-eng.zip`
- Immigration: table `17-10-0040-01` → ZIP at `https://www150.statcan.gc.ca/t1/tbl1/en/dtbl!17100040-eng.zip`

ZIP contains a main CSV (e.g. `17100005-eng.csv`) and a `_MetaData.csv`. Columns in the main CSV include: `REF_DATE`, `GEO`, `VALUE`, plus descriptor columns.

- [ ] **Step 1: Write failing test**

Create `backend/src/modules/data-sync/fetchers/statcan.fetcher.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { StatcanFetcher } from './statcan.fetcher.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import axios from 'axios';
import AdmZip from 'adm-zip';

jest.mock('axios');
jest.mock('adm-zip');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedAdmZip = AdmZip as jest.MockedClass<typeof AdmZip>;

const POP_CSV = `REF_DATE,GEO,Age group,Sex,VALUE
2025-01-01,Ontario,All ages,Both sexes,15200000
2025-01-01,Toronto CMA,All ages,Both sexes,0
2017-01-01,Ontario,All ages,Both sexes,13900000
`;

const MIGRATION_CSV = `REF_DATE,GEO,Components of demographic growth,VALUE
2025,Canada,Immigrants,485000
2025,Canada,Net non-permanent residents,275000
2017,Canada,Immigrants,286000
`;

function makeZipBuffer(filename: string, content: string): Buffer {
  const zip = new (jest.requireActual('adm-zip') as typeof AdmZip)();
  zip.addFile(filename, Buffer.from(content));
  return zip.toBuffer();
}

describe('StatcanFetcher', () => {
  let fetcher: StatcanFetcher;
  const mockPrisma = {
    populationGrowth: { upsert: jest.fn() },
    immigration: { upsert: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [StatcanFetcher, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    fetcher = module.get(StatcanFetcher);
    jest.clearAllMocks();
  });

  it('upserts Ontario population from 2018 onward', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: makeZipBuffer('17100005-eng.csv', POP_CSV) })
      .mockResolvedValueOnce({ data: makeZipBuffer('17100040-eng.csv', MIGRATION_CSV) });

    MockedAdmZip.mockImplementation((buffer) => {
      const realZip = new (jest.requireActual('adm-zip') as typeof AdmZip)(buffer);
      return realZip as unknown as InstanceType<typeof AdmZip>;
    });

    await fetcher.fetch();

    expect(mockPrisma.populationGrowth.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ year_region: { year: 2025, region: 'ontario' } }),
      }),
    );
    // 2017 row should be skipped
    expect(mockPrisma.populationGrowth.upsert).toHaveBeenCalledTimes(1);
  });

  it('upserts immigration data from 2018 onward', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: makeZipBuffer('17100005-eng.csv', POP_CSV) })
      .mockResolvedValueOnce({ data: makeZipBuffer('17100040-eng.csv', MIGRATION_CSV) });

    MockedAdmZip.mockImplementation((buffer) => {
      const realZip = new (jest.requireActual('adm-zip') as typeof AdmZip)(buffer);
      return realZip as unknown as InstanceType<typeof AdmZip>;
    });

    await fetcher.fetch();

    expect(mockPrisma.immigration.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { year: 2025 },
        create: expect.objectContaining({ year: 2025, newPermanentResidents: 485000 }),
      }),
    );
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd backend && npm test -- statcan --no-coverage
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement StatcanFetcher**

Create `backend/src/modules/data-sync/fetchers/statcan.fetcher.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { DataFetcher } from './data-fetcher.interface.js';

const POP_ZIP_URL = 'https://www150.statcan.gc.ca/t1/tbl1/en/dtbl!17100005-eng.zip';
const MIGRATION_ZIP_URL = 'https://www150.statcan.gc.ca/t1/tbl1/en/dtbl!17100040-eng.zip';

@Injectable()
export class StatcanFetcher implements DataFetcher {
  readonly sourceKey = 'statcan_population';
  private readonly logger = new Logger(StatcanFetcher.name);

  constructor(private readonly prisma: PrismaService) {}

  private async downloadCsvFromZip(url: string, csvFilenameFragment: string): Promise<Record<string, string>[]> {
    const response = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
    const zip = new AdmZip(Buffer.from(response.data));
    const entry = zip.getEntries().find(
      (e) => e.entryName.includes(csvFilenameFragment) && !e.entryName.includes('MetaData'),
    );
    if (!entry) throw new Error(`CSV entry not found in ZIP from ${url}`);
    const csvContent = entry.getData().toString('utf-8');
    return parse(csvContent, { columns: true, skip_empty_lines: true });
  }

  async fetch(): Promise<void> {
    await this.syncPopulation();
    await this.syncImmigration();
  }

  private async syncPopulation(): Promise<void> {
    const rows = await this.downloadCsvFromZip(POP_ZIP_URL, '17100005');
    let upserted = 0;

    // Group by year+region to get one row per year (some tables have monthly entries)
    const seen = new Set<string>();
    for (const row of rows) {
      const ageGroup = row['Age group'] ?? '';
      const sex = row['Sex'] ?? '';
      if (!ageGroup.toLowerCase().includes('all') && !ageGroup.toLowerCase().includes('total')) continue;
      if (!sex.toLowerCase().includes('both')) continue;

      const geo = row['GEO'] ?? '';
      let region: string;
      if (geo === 'Ontario') region = 'ontario';
      else continue; // Skip other geographies (Toronto CMA is in a different table)

      const refDate = row['REF_DATE'] ?? '';
      const year = parseInt(refDate.slice(0, 4), 10);
      if (isNaN(year) || year < 2018) continue;

      const key = `${year}-${region}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const multiplier = parseInt(row['SCALAR_FACTOR'] === 'thousands' ? '1000' : '1', 10);
      const population = Math.round(parseFloat(row['VALUE'] ?? '0') * multiplier);
      if (isNaN(population) || population === 0) continue;

      await this.prisma.populationGrowth.upsert({
        where: { year_region: { year, region } },
        update: { population },
        create: { year, region, population, yoyGrowthPct: 0 },
      });
      upserted++;
    }

    this.logger.log(`StatcanFetcher (population): upserted ${upserted} rows`);
  }

  private async syncImmigration(): Promise<void> {
    const rows = await this.downloadCsvFromZip(MIGRATION_ZIP_URL, '17100040');

    // Accumulate by year: immigrants + net non-permanent residents
    const byYear = new Map<number, { immigrants: number; netNonPerm: number }>();
    for (const row of rows) {
      const geo = row['GEO'] ?? '';
      if (geo !== 'Canada') continue;

      const component = row['Components of demographic growth'] ?? '';
      const refDate = row['REF_DATE'] ?? '';
      const year = parseInt(refDate.slice(0, 4), 10);
      if (isNaN(year) || year < 2018) continue;

      const value = parseInt(row['VALUE'] ?? '0', 10);
      if (isNaN(value)) continue;
      if (!byYear.has(year)) byYear.set(year, { immigrants: 0, netNonPerm: 0 });

      const entry = byYear.get(year)!;
      if (component.toLowerCase().includes('immigrant')) entry.immigrants = value;
      if (component.toLowerCase().includes('non-permanent')) entry.netNonPerm = value;
    }

    for (const [year, { immigrants, netNonPerm }] of byYear) {
      await this.prisma.immigration.upsert({
        where: { year },
        update: { newPermanentResidents: immigrants, temporaryResidentsNet: netNonPerm },
        create: { year, newPermanentResidents: immigrants, temporaryResidentsNet: netNonPerm },
      });
    }

    this.logger.log(`StatcanFetcher (immigration): upserted ${byYear.size} years`);
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd backend && npm test -- statcan --no-coverage
```

Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/data-sync/fetchers/statcan.fetcher.ts \
        backend/src/modules/data-sync/fetchers/statcan.fetcher.spec.ts
git commit -m "feat: add StatcanFetcher for population and immigration data"
```

---

### Task 9: DataSyncService — wire up all fetchers + orchestrator test

**Files:**
- Modify: `backend/src/modules/data-sync/data-sync.service.ts`
- Create: `backend/src/modules/data-sync/data-sync.service.spec.ts`
- Modify: `backend/src/modules/data-sync/data-sync.module.ts`

- [ ] **Step 1: Write failing test**

Create `backend/src/modules/data-sync/data-sync.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { DataSyncService } from './data-sync.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { BocRatesFetcher } from './fetchers/boc-rates.fetcher.js';
import { CmhcHousingStartsFetcher } from './fetchers/cmhc-housing-starts.fetcher.js';
import { CmhcVacancyFetcher } from './fetchers/cmhc-vacancy.fetcher.js';
import { CmhcRentalFetcher } from './fetchers/cmhc-rental.fetcher.js';
import { StatcanFetcher } from './fetchers/statcan.fetcher.js';

describe('DataSyncService', () => {
  let service: DataSyncService;
  const mockPrisma = {
    dataSource: {
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    },
  };
  const mockFetcher = (key: string) => ({ sourceKey: key, fetch: jest.fn().mockResolvedValue(undefined) });
  const bocFetcher = mockFetcher('boc_rates');
  const startsFetcher = mockFetcher('cmhc_housing_starts');
  const vacancyFetcher = mockFetcher('cmhc_vacancy');
  const rentalFetcher = mockFetcher('cmhc_rental');
  const statcanFetcher = mockFetcher('statcan_population');

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DataSyncService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BocRatesFetcher, useValue: bocFetcher },
        { provide: CmhcHousingStartsFetcher, useValue: startsFetcher },
        { provide: CmhcVacancyFetcher, useValue: vacancyFetcher },
        { provide: CmhcRentalFetcher, useValue: rentalFetcher },
        { provide: StatcanFetcher, useValue: statcanFetcher },
      ],
    }).compile();
    service = module.get(DataSyncService);
    jest.clearAllMocks();
  });

  it('calls all 5 fetchers on syncAll()', async () => {
    await service.syncAll();
    expect(bocFetcher.fetch).toHaveBeenCalledTimes(1);
    expect(startsFetcher.fetch).toHaveBeenCalledTimes(1);
    expect(vacancyFetcher.fetch).toHaveBeenCalledTimes(1);
    expect(rentalFetcher.fetch).toHaveBeenCalledTimes(1);
    expect(statcanFetcher.fetch).toHaveBeenCalledTimes(1);
  });

  it('marks source as success when fetch completes', async () => {
    await service.syncAll();
    expect(mockPrisma.dataSource.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'boc_rates' },
        data: expect.objectContaining({ lastSyncStatus: 'success' }),
      }),
    );
  });

  it('marks source as failed when fetcher throws, but continues other fetchers', async () => {
    bocFetcher.fetch.mockRejectedValueOnce(new Error('network error'));
    await service.syncAll();

    expect(mockPrisma.dataSource.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'boc_rates' },
        data: expect.objectContaining({ lastSyncStatus: 'failed', errorMessage: 'network error' }),
      }),
    );
    // Other fetchers still ran
    expect(startsFetcher.fetch).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd backend && npm test -- data-sync.service --no-coverage
```

Expected: FAIL (DataSyncService not updated yet).

- [ ] **Step 3: Update DataSyncService with full orchestration**

Replace the contents of `backend/src/modules/data-sync/data-sync.service.ts`:

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';
import { BocRatesFetcher } from './fetchers/boc-rates.fetcher.js';
import { CmhcHousingStartsFetcher } from './fetchers/cmhc-housing-starts.fetcher.js';
import { CmhcVacancyFetcher } from './fetchers/cmhc-vacancy.fetcher.js';
import { CmhcRentalFetcher } from './fetchers/cmhc-rental.fetcher.js';
import { StatcanFetcher } from './fetchers/statcan.fetcher.js';
import type { DataFetcher } from './fetchers/data-fetcher.interface.js';

@Injectable()
export class DataSyncService implements OnModuleInit {
  private readonly logger = new Logger(DataSyncService.name);
  private readonly fetchers: DataFetcher[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly bocRatesFetcher: BocRatesFetcher,
    private readonly cmhcHousingStartsFetcher: CmhcHousingStartsFetcher,
    private readonly cmhcVacancyFetcher: CmhcVacancyFetcher,
    private readonly cmhcRentalFetcher: CmhcRentalFetcher,
    private readonly statcanFetcher: StatcanFetcher,
  ) {
    this.fetchers = [
      this.bocRatesFetcher,
      this.cmhcHousingStartsFetcher,
      this.cmhcVacancyFetcher,
      this.cmhcRentalFetcher,
      this.statcanFetcher,
    ];
  }

  async onModuleInit() {
    // Run on startup without blocking — uses real data immediately after first deploy
    setImmediate(() => this.syncAll());
  }

  @Cron('0 3 * * 1') // Every Monday at 3:00 AM
  async syncAll(): Promise<void> {
    this.logger.log('Starting data sync...');

    const results = await Promise.allSettled(
      this.fetchers.map((f) => this.runFetcher(f)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    this.logger.log(`Data sync complete: ${succeeded} succeeded, ${failed} failed`);
  }

  private async runFetcher(fetcher: DataFetcher): Promise<void> {
    const now = new Date();
    try {
      await fetcher.fetch();
      await this.prisma.dataSource.update({
        where: { key: fetcher.sourceKey },
        data: { lastSyncStatus: 'success', lastSyncedAt: now, errorMessage: null },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Fetcher ${fetcher.sourceKey} failed: ${message}`);
      await this.prisma.dataSource.update({
        where: { key: fetcher.sourceKey },
        data: { lastSyncStatus: 'failed', lastSyncedAt: now, errorMessage: message },
      });
    }
  }

  async findAllSources() {
    return this.prisma.dataSource.findMany({ orderBy: { key: 'asc' } });
  }
}
```

- [ ] **Step 4: Update DataSyncModule to provide all fetchers**

Replace contents of `backend/src/modules/data-sync/data-sync.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { DataSyncService } from './data-sync.service.js';
import { DataSyncController } from './data-sync.controller.js';
import { BocRatesFetcher } from './fetchers/boc-rates.fetcher.js';
import { CmhcHousingStartsFetcher } from './fetchers/cmhc-housing-starts.fetcher.js';
import { CmhcVacancyFetcher } from './fetchers/cmhc-vacancy.fetcher.js';
import { CmhcRentalFetcher } from './fetchers/cmhc-rental.fetcher.js';
import { StatcanFetcher } from './fetchers/statcan.fetcher.js';

@Module({
  imports: [PrismaModule],
  providers: [
    DataSyncService,
    BocRatesFetcher,
    CmhcHousingStartsFetcher,
    CmhcVacancyFetcher,
    CmhcRentalFetcher,
    StatcanFetcher,
  ],
  controllers: [DataSyncController],
})
export class DataSyncModule {}
```

- [ ] **Step 5: Run test — expect PASS**

```bash
cd backend && npm test -- data-sync.service --no-coverage
```

Expected: 3 passing tests.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/data-sync/
git commit -m "feat: wire up DataSyncService with 5 fetchers and Promise.allSettled error handling"
```

---

### Task 10: Register DataSyncModule in AppModule + smoke test

**Files:**
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Add ScheduleModule and DataSyncModule to AppModule**

Replace `backend/src/app.module.ts`:

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
import { DataSyncModule } from './modules/data-sync/data-sync.module.js';

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
    DataSyncModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Run all backend tests**

```bash
cd backend && npm test --no-coverage
```

Expected: all existing tests pass + new tests pass.

- [ ] **Step 3: Start the backend and verify the endpoint**

```bash
cd backend && npm run start:dev &
sleep 5
curl http://localhost:3001/api/v1/data-sources
```

Expected: JSON array with 6 data source objects including `key`, `name`, `lastSyncStatus`, etc.

- [ ] **Step 4: Stop the dev server and commit**

```bash
kill %1
git add backend/src/app.module.ts
git commit -m "feat: register DataSyncModule and ScheduleModule in AppModule"
```

---

### Task 11: Frontend — add DataSource type + getDataSources()

**Files:**
- Modify: `frontend/src/services/api.ts`

- [ ] **Step 1: Add DataSource type and getDataSources() to api.ts**

Add after the `ImmigrationData` interface (around line 86) in `frontend/src/services/api.ts`:

```typescript
export interface DataSource {
  id: number;
  key: string;
  name: string;
  description: string;
  url: string;
  lastSyncedAt: string | null;
  lastSyncStatus: 'pending' | 'success' | 'failed' | 'manual';
  errorMessage: string | null;
  updatedAt: string;
}
```

Add after the `getImmigration()` function:

```typescript
// ─── Data sources ─────────────────────────────────────────────────────────────

export async function getDataSources(): Promise<DataSource[]> {
  const { data } = await api.get<DataSource[]>('/data-sources');
  return data;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/api.ts
git commit -m "feat: add DataSource type and getDataSources() to frontend API client"
```

---

### Task 12: DataSourceCard component

**Files:**
- Create: `frontend/src/components/DataSourceCard.tsx`

- [ ] **Step 1: Create DataSourceCard**

Create `frontend/src/components/DataSourceCard.tsx`:

```typescript
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DataSource } from '@/services/api';

function SyncBadge({ status, lastSyncedAt }: { status: DataSource['lastSyncStatus']; lastSyncedAt: string | null }) {
  if (status === 'manual') {
    return <Badge variant="outline" className="text-muted-foreground">Atualização manual</Badge>;
  }
  if (status === 'pending') {
    return <Badge variant="outline" className="text-muted-foreground">Aguardando sincronização</Badge>;
  }
  if (status === 'failed') {
    return (
      <Badge variant="destructive">
        Falha na última sincronização
      </Badge>
    );
  }
  // success
  const date = lastSyncedAt
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(lastSyncedAt))
    : '—';
  return (
    <Badge
      className="text-xs font-medium"
      style={{ background: 'hsl(142, 76%, 36%)', color: 'white' }}
    >
      Atualizado em {date}
    </Badge>
  );
}

interface DataSourceCardProps {
  source: DataSource;
}

export function DataSourceCard({ source }: DataSourceCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-tight">{source.name}</CardTitle>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Visit source: ${source.name}`}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 flex-1">
        <p className="text-xs text-muted-foreground leading-relaxed">{source.description}</p>
        <div className="mt-auto">
          <SyncBadge status={source.lastSyncStatus} lastSyncedAt={source.lastSyncedAt} />
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/DataSourceCard.tsx
git commit -m "feat: add DataSourceCard component with sync status badge"
```

---

### Task 13: AboutDataPage + route + sidebar nav item

**Files:**
- Create: `frontend/src/pages/AboutDataPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Create AboutDataPage**

Create `frontend/src/pages/AboutDataPage.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { Database } from 'lucide-react';
import { DataSourceCard } from '@/components/DataSourceCard';
import { getDataSources } from '@/services/api';
import type { DataSource } from '@/services/api';

export function AboutDataPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDataSources()
      .then(setSources)
      .catch(() => setError('Não foi possível carregar as fontes de dados.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Sobre os Dados</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Todas as fontes utilizadas neste dashboard, com status de sincronização e links oficiais.
        </p>
      </div>

      {/* Source cards */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((source) => (
            <DataSourceCard key={source.key} source={source} />
          ))}
        </div>
      )}

      {/* Methodology note */}
      {!loading && !error && (
        <div className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground max-w-2xl">
            Os dados são sincronizados automaticamente toda segunda-feira às 3h (horário de Brasília).
            O foco geográfico é Toronto CMA e Ontario. Preços de imóveis (TRREB) não possuem API
            pública gratuita e são atualizados manualmente.
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add /about-data route to App.tsx**

In `frontend/src/App.tsx`, add the import after the existing page imports:

```typescript
import { AboutDataPage } from '@/pages/AboutDataPage';
```

Add the route inside the protected `<Route>` block, after `<Route path="/market" ...>`:

```typescript
<Route path="/about-data" element={<AboutDataPage />} />
```

- [ ] **Step 3: Add nav item to Sidebar.tsx**

In `frontend/src/components/layout/Sidebar.tsx`, add the import:

```typescript
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Info,
} from 'lucide-react';
```

Add entry to the `NAV_ITEMS` array after `Market`:

```typescript
{ label: 'Sobre os Dados', to: '/about-data', icon: Info },
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Smoke test in browser**

```bash
cd frontend && npm run dev &
```

Open `http://localhost:3000`, log in, click "Sobre os Dados" in the sidebar. Confirm the page loads with 6 cards. Check that the TRREB card shows the gray "Atualização manual" badge and others show "Aguardando sincronização".

- [ ] **Step 6: Commit**

```bash
kill %1
git add frontend/src/pages/AboutDataPage.tsx \
        frontend/src/components/DataSourceCard.tsx \
        frontend/src/App.tsx \
        frontend/src/components/layout/Sidebar.tsx
git commit -m "feat: add /about-data page with data source cards and sync status"
```

---

### Task 14: Run full test suite + final verification

**Files:** None — verification only.

- [ ] **Step 1: Run all tests**

```bash
cd backend && npm test --no-coverage
```

Expected: all tests pass, no regressions.

- [ ] **Step 2: Start both servers and verify end-to-end**

```bash
cd backend && npm run start:dev &
cd frontend && npm run dev &
sleep 6
```

Open `http://localhost:3000`. Confirm:
1. `/about-data` page is accessible from the sidebar
2. 6 source cards are shown
3. After the backend startup sync completes (check backend logs), refresh the page — BoC and StatCan cards should show green "Atualizado" badge if their APIs returned data
4. TRREB card always shows gray "Atualização manual" badge

- [ ] **Step 3: Check backend logs for sync result**

```bash
# In the terminal where backend is running, look for:
# [DataSyncService] Starting data sync...
# [BocRatesFetcher] BocRatesFetcher: synced N year(s)
# [DataSyncService] Data sync complete: N succeeded, N failed
```

If any fetcher fails due to incorrect CSV column names (CMHC/StatCan), the error message will appear in the logs and in the `data_sources.error_message` column. Update the relevant column name constant in the fetcher and re-run.

- [ ] **Step 4: Final commit**

```bash
kill %1 %2
git add -A
git commit -m "feat: complete CMHC data pipeline with weekly cron and /about-data transparency page"
```
