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
