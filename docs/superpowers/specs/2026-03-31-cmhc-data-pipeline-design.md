# CMHC Data Pipeline + Data Transparency Page — Design Spec

**Date:** 2026-03-31
**Status:** Approved

---

## Overview

Replace manually-crafted CSV data with an automated weekly pipeline that fetches real data from public APIs (CMHC, Bank of Canada, Statistics Canada). Add a `data_sources` table to track sync status per source. Add a frontend page `/about-data` that displays provenance and last-updated status for each dataset.

---

## Architecture

Three new parts:

1. **`DataSyncModule` (backend)** — NestJS module with a weekly cron job that orchestrates 5 independent fetchers.
2. **`data_sources` table (database)** — tracks each data source's metadata, last sync time, and sync status.
3. **`/about-data` page (frontend)** — displays source cards consuming `GET /api/v1/data-sources`.

**Flow:**
```
cron (every Monday 3am) → DataSyncService → [5 fetchers via Promise.allSettled]
  → upsert data into existing tables
  → update data_sources record (status, last_synced_at, error_message)
```

On `onModuleInit`, the sync also runs once immediately to populate data on first deploy.

---

## Data Sources

| Key | Name | Source | API Type | Cadence |
|---|---|---|---|---|
| `cmhc_vacancy` | CMHC Rental Market Survey (Vacancy) | open.canada.ca | CSV download | Annual (Nov/Dec) |
| `cmhc_rental` | CMHC Rental Market Survey (Rents) | open.canada.ca | CSV download | Annual (Nov/Dec) |
| `cmhc_housing_starts` | CMHC Housing Now | open.canada.ca | CSV download | Monthly |
| `boc_rates` | Bank of Canada Valet API | valet.bankofcanada.ca | REST JSON | Ongoing |
| `statcan_population` | Statistics Canada Web Data Service | www150.statcan.gc.ca | REST JSON | Annual (~1yr lag) |
| `trreb_home_prices` | TRREB Market Watch | trreb.ca | Manual CSV | No public API |

**TRREB note:** No free public API exists. The existing manual CSV is retained. The data_sources record for TRREB has `sync_status = 'manual'` and is never updated by the cron.

---

## Database Changes

### New table: `data_sources`

```prisma
model DataSource {
  id             Int       @id @default(autoincrement())
  key            String    @unique
  name           String
  description    String
  url            String
  lastSyncedAt   DateTime?
  lastSyncStatus String    @default("pending") // "pending" | "success" | "failed" | "manual"
  errorMessage   String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

Seeded with one record per source on first deploy.

---

## Backend — DataSyncModule

### Structure

```
src/modules/data-sync/
  data-sync.module.ts
  data-sync.service.ts       # orchestrator + cron
  fetchers/
    cmhc-vacancy.fetcher.ts
    cmhc-rental.fetcher.ts
    cmhc-housing-starts.fetcher.ts
    boc-rates.fetcher.ts
    statcan.fetcher.ts
```

### DataSyncService responsibilities

- Runs cron every Monday at 3am (`@Cron('0 3 * * 1')`)
- Runs once on `onModuleInit`
- Calls all 5 fetchers via `Promise.allSettled` (failures are isolated)
- Updates `data_sources` after each fetcher resolves or rejects

### Fetcher interface

Each fetcher implements:
```typescript
interface DataFetcher {
  readonly sourceKey: string;
  fetch(): Promise<void>; // fetches, transforms, upserts data
}
```

### New endpoint

`GET /api/v1/data-sources` — returns all `DataSource` records. No auth required.

---

## Frontend — `/about-data` page

### Route

Added to main navigation. Path: `/about-data`.

### Components

- `DataSourceCard` — displays one source with name, description, link, last sync date, status badge
- `AboutDataPage` — grid of cards + methodology note at bottom

### Status badges

| Status | Display |
|---|---|
| `success` | ✓ green badge with date |
| `failed` | ⚠ red badge + last successful date |
| `manual` | gray "Atualização manual" badge |
| `pending` | gray "Aguardando sincronização" |

### Methodology note (bottom of page)

> "Os dados são sincronizados automaticamente toda segunda-feira às 3h. O foco é Toronto CMA e Ontario. Preços de imóveis (TRREB) são atualizados manualmente."

---

## Error Handling

- Fetchers are isolated — one failure does not affect others (`Promise.allSettled`)
- On failure: `last_sync_status = 'failed'`, `error_message` saved, existing data preserved
- No automatic retry — next attempt is the following Monday
- NestJS Logger emits error for each failed fetcher

---

## Out of Scope

- Retry logic with backoff
- Webhook/alert on sync failure
- Historical sync logs (only latest sync tracked per source)
- TRREB automated fetching
