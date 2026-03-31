import axios from 'axios';
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

async function downloadCmhcCsv(packageId: string): Promise<Record<string, string>[]> {
  const ckanUrl = `https://open.canada.ca/data/api/3/action/package_show?id=${packageId}`;
  const pkg = await axios.get<{ result: { resources: { format: string; url: string }[] } }>(ckanUrl);
  const csvResource = pkg.data.result.resources.find(
    (r) => r.format?.toUpperCase() === 'CSV',
  );
  if (!csvResource) throw new Error(`No CSV resource in CMHC package: ${packageId}`);
  const csvResponse = await axios.get<string>(csvResource.url);
  return parse(csvResponse.data, { columns: true, skip_empty_lines: true });
}

export async function downloadVacancyCsv(): Promise<Record<string, string>[]> {
  return downloadCmhcCsv(CMHC_VACANCY_PACKAGE);
}

export async function downloadRentalCsv(): Promise<Record<string, string>[]> {
  return downloadCmhcCsv(CMHC_RENTAL_PACKAGE);
}
