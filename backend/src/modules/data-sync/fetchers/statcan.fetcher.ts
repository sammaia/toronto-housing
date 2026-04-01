import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { DataFetcher } from './data-fetcher.interface.js';

// StatCan bulk CSV download URLs (table 17-10-0005-01 and 17-10-0040-01)
// The /dtbl! URL format was deprecated; current format uses the full 10-digit PID
const POP_ZIP_URL = 'https://www150.statcan.gc.ca/t1/tbl1/en/dtbl!1710000501-eng.zip';
const MIGRATION_ZIP_URL = 'https://www150.statcan.gc.ca/t1/tbl1/en/dtbl!1710004001-eng.zip';

@Injectable()
export class StatcanFetcher implements DataFetcher {
  readonly sourceKey = 'statcan_population';
  private readonly logger = new Logger(StatcanFetcher.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; toronto-housing-sync/1.0)',
    Accept: 'application/zip, application/octet-stream, */*',
  };

  private async downloadCsvFromZip(url: string, csvFilenameFragment: string): Promise<Record<string, string>[]> {
    const response = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      headers: this.BROWSER_HEADERS,
    });
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

    const seen = new Set<string>();
    for (const row of rows) {
      const ageGroup = row['Age group'] ?? '';
      const sex = row['Sex'] ?? '';
      if (!ageGroup.toLowerCase().includes('all') && !ageGroup.toLowerCase().includes('total')) continue;
      if (!sex.toLowerCase().includes('both')) continue;

      const geo = row['GEO'] ?? '';
      if (geo !== 'Ontario') continue;

      const refDate = row['REF_DATE'] ?? '';
      const year = parseInt(refDate.slice(0, 4), 10);
      if (isNaN(year) || year < 2018) continue;

      const key = `${year}-ontario`;
      if (seen.has(key)) continue;
      seen.add(key);

      const multiplier = row['SCALAR_FACTOR'] === 'thousands' ? 1000 : 1;
      const population = Math.round(parseFloat(row['VALUE'] ?? '0') * multiplier);
      if (isNaN(population) || population === 0) continue;

      await this.prisma.populationGrowth.upsert({
        where: { year_region: { year, region: 'ontario' } },
        update: { population },
        create: { year, region: 'ontario', population, yoyGrowthPct: 0 },
      });
      upserted++;
    }

    this.logger.log(`StatcanFetcher (population): upserted ${upserted} rows`);
  }

  private async syncImmigration(): Promise<void> {
    const rows = await this.downloadCsvFromZip(MIGRATION_ZIP_URL, '17100040');

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
