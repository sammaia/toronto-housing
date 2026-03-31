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
      throw err;
    }
  }

  async findAllSources() {
    return this.prisma.dataSource.findMany({ orderBy: { key: 'asc' } });
  }
}
