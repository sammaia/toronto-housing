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
