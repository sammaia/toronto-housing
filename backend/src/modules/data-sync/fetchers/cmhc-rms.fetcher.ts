import axios from 'axios';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';

// Vacancy rates, apartment structures of six units and over, privately initiated in census metropolitan areas
// Package UUID from open.canada.ca CKAN API (packages use UUID names, not slugs)
// Verified via: curl -s "https://open.canada.ca/data/api/3/action/package_search?q=vacancy+rate+apartment+cmhc+toronto&rows=10"
// Title: "Vacancy rates, apartment structures of six units and over, privately initiated in census metropolitan areas"
const CMHC_VACANCY_PACKAGE = 'f0cd8e90-3268-4c58-b43b-98ee71db9b21';

// Average rents for areas with a population of 10,000 and over
// Package UUID from open.canada.ca CKAN API
// Verified via: curl -s "https://open.canada.ca/data/api/3/action/package_search?q=cmhc+average+rent+apartment&rows=5"
// Title: "Average rents for areas with a population of 10,000 and over"
const CMHC_RENTAL_PACKAGE = '1146388b-a150-4e70-98ec-eb40cb9083c8';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; toronto-housing-sync/1.0)',
  Accept: 'application/json, text/plain, */*',
};

async function downloadCmhcCsv(packageId: string): Promise<Record<string, string>[]> {
  const ckanUrl = `https://open.canada.ca/data/api/3/action/package_show?id=${packageId}`;
  const pkg = await axios.get<{ success: boolean; result: { resources: { format: string; url: string }[] } }>(
    ckanUrl,
    { headers: BROWSER_HEADERS },
  );
  if (!pkg.data.result) {
    throw new Error(`CKAN API returned no result for package ${packageId} — response: ${JSON.stringify(pkg.data).slice(0, 200)}`);
  }
  const csvResource = pkg.data.result.resources.find(
    (r) => r.format?.toUpperCase() === 'CSV',
  );
  if (!csvResource) throw new Error(`No CSV resource in CMHC package: ${packageId}`);

  const fileResponse = await axios.get<ArrayBuffer>(csvResource.url, {
    headers: { ...BROWSER_HEADERS, Accept: 'application/zip, application/octet-stream, */*' },
    responseType: 'arraybuffer',
  });
  const buf = Buffer.from(fileResponse.data);

  let csvText: string;
  if (buf[0] === 0x50 && buf[1] === 0x4b) {
    // ZIP archive — extract the first CSV entry
    const zip = new AdmZip(buf);
    const entry = zip.getEntries().find(
      (e) => e.entryName.endsWith('.csv') && !e.entryName.includes('MetaData'),
    );
    if (!entry) throw new Error(`No CSV entry found in ZIP from CMHC package: ${packageId}`);
    csvText = entry.getData().toString('utf-8');
  } else {
    csvText = buf.toString('utf-8');
  }

  return parse(csvText, { columns: true, skip_empty_lines: true });
}

export async function downloadVacancyCsv(): Promise<Record<string, string>[]> {
  return downloadCmhcCsv(CMHC_VACANCY_PACKAGE);
}

export async function downloadRentalCsv(): Promise<Record<string, string>[]> {
  return downloadCmhcCsv(CMHC_RENTAL_PACKAGE);
}
