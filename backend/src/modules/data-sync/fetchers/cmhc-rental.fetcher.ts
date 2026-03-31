import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { downloadRentalCsv } from './cmhc-rms.fetcher.js';
import type { DataFetcher } from './data-fetcher.interface.js';

@Injectable()
export class CmhcRentalFetcher implements DataFetcher {
  readonly sourceKey = 'cmhc_rental';
  private readonly logger = new Logger(CmhcRentalFetcher.name);

  constructor(private readonly prisma: PrismaService) {}

  async fetch(): Promise<void> {
    const rows = await downloadRentalCsv();
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
