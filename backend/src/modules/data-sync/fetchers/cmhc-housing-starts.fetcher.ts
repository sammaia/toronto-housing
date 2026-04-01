import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { DataFetcher } from './data-fetcher.interface.js';

// CMHC housing starts in selected census metropolitan areas (includes Toronto CMA)
// Package UUID from open.canada.ca CKAN API (packages use UUID names, not slugs)
// Verified via: curl -s "https://open.canada.ca/data/api/3/action/package_search?q=cmhc+housing+starts+completions&rows=5"
// Title: "Housing starts, under construction and completions in selected census metropolitan areas"
const CMHC_STARTS_PACKAGE = '449c8301-65ae-4225-ac69-9a83d01b59ab';
const CKAN_URL = `https://open.canada.ca/data/api/3/action/package_show?id=${CMHC_STARTS_PACKAGE}`;

@Injectable()
export class CmhcHousingStartsFetcher implements DataFetcher {
  readonly sourceKey = 'cmhc_housing_starts';
  private readonly logger = new Logger(CmhcHousingStartsFetcher.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; toronto-housing-sync/1.0)',
    Accept: 'application/json, text/plain, */*',
  };

  async fetch(): Promise<void> {
    // Discover CSV URL dynamically via CKAN API
    const pkg = await axios.get<{ success: boolean; result: { resources: { format: string; url: string }[] } }>(
      CKAN_URL,
      { headers: this.BROWSER_HEADERS },
    );
    if (!pkg.data.result) {
      throw new Error(`CKAN API returned no result for package ${CMHC_STARTS_PACKAGE} — response: ${JSON.stringify(pkg.data).slice(0, 200)}`);
    }
    const csvResource = pkg.data.result.resources.find(
      (r) => r.format?.toUpperCase() === 'CSV',
    );
    if (!csvResource) throw new Error(`No CSV resource found in CMHC package: ${CMHC_STARTS_PACKAGE}`);

    const fileResponse = await axios.get<ArrayBuffer>(csvResource.url, {
      headers: { ...this.BROWSER_HEADERS, Accept: 'application/zip, application/octet-stream, */*' },
      responseType: 'arraybuffer',
    });
    const buf = Buffer.from(fileResponse.data);

    let csvText: string;
    if (buf[0] === 0x50 && buf[1] === 0x4b) {
      const zip = new AdmZip(buf);
      const entry = zip.getEntries().find(
        (e) => e.entryName.endsWith('.csv') && !e.entryName.includes('MetaData'),
      );
      if (!entry) throw new Error(`No CSV entry in ZIP from CMHC package: ${CMHC_STARTS_PACKAGE}`);
      csvText = entry.getData().toString('utf-8');
    } else {
      csvText = buf.toString('utf-8');
    }

    const rows: Record<string, string>[] = parse(csvText, {
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
