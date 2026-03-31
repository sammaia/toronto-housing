import axios from 'axios';
import { parse } from 'csv-parse/sync';

// Vacancy rates, apartment structures of six units and over, privately initiated in census metropolitan areas
// Package UUID from open.canada.ca CKAN API (packages use UUID names, not slugs)
// Verified via: curl -s "https://open.canada.ca/data/api/3/action/package_search?q=vacancy+rate+apartment+cmhc+toronto&rows=10"
// Title: "Vacancy rates, apartment structures of six units and over, privately initiated in census metropolitan areas"
const CMHC_RMS_PACKAGE = 'f0cd8e90-3268-4c58-b43b-98ee71db9b21';
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
