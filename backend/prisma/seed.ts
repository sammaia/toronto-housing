import 'dotenv/config';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const dataDir = resolve(__dirname, '..', 'data');

function readCsv(filename: string) {
  const content = readFileSync(resolve(dataDir, filename), 'utf-8');
  return parse(content, { columns: true, skip_empty_lines: true });
}

async function main() {
  console.log('Seeding vacancy rates...');
  const vacancyRows = readCsv('vacancy_rates.csv');
  await prisma.vacancyRate.createMany({
    data: vacancyRows.map((r: any) => ({
      year: parseInt(r.year),
      geography: r.geography,
      bedroomType: r.bedroom_type,
      vacancyRate: parseFloat(r.vacancy_rate),
      universe: parseInt(r.universe),
    })),
    skipDuplicates: true,
  });

  console.log('Seeding rental prices...');
  const rentalRows = readCsv('rental_prices.csv');
  await prisma.rentalPrice.createMany({
    data: rentalRows.map((r: any) => ({
      year: parseInt(r.year),
      geography: r.geography,
      bedroomType: r.bedroom_type,
      averageRent: parseFloat(r.average_rent),
      percentageChange: parseFloat(r.percentage_change),
    })),
    skipDuplicates: true,
  });

  console.log('Seeding housing starts...');
  const housingRows = readCsv('housing_starts.csv');
  await prisma.housingStart.createMany({
    data: housingRows.map((r: any) => ({
      year: parseInt(r.year),
      month: parseInt(r.month),
      geography: r.geography,
      dwellingType: r.dwelling_type,
      units: parseInt(r.units),
    })),
    skipDuplicates: true,
  });

  console.log('Seeding home prices...');
  const homePriceRows = readCsv('toronto_avg_home_prices.csv');
  await prisma.homePrice.createMany({
    data: homePriceRows.map((r: any) => ({
      year: parseInt(r.year),
      propertyType: r.property_type,
      avgPrice: parseFloat(r.avg_price),
    })),
    skipDuplicates: true,
  });

  console.log('Seeding population growth...');
  const popRows = readCsv('population_growth.csv');
  await prisma.populationGrowth.createMany({
    data: popRows.map((r: any) => ({
      year: parseInt(r.year),
      region: r.region,
      population: parseInt(r.population),
      yoyGrowthPct: parseFloat(r.yoy_growth_pct),
    })),
    skipDuplicates: true,
  });

  console.log('Seeding immigration...');
  const immigrationRows = readCsv('immigration_ontario.csv');
  await prisma.immigration.createMany({
    data: immigrationRows.map((r: any) => ({
      year: parseInt(r.year),
      newPermanentResidents: parseInt(r.new_permanent_residents),
      temporaryResidentsNet: parseInt(r.temporary_residents_net),
    })),
    skipDuplicates: true,
  });

  console.log('Seeding mortgage rates...');
  const mortgageRows = readCsv('mortgage_rates.csv');
  await prisma.mortgageRate.createMany({
    data: mortgageRows.map((r: any) => ({
      year: parseInt(r.year),
      avg5yrFixedRate: parseFloat(r.avg_5yr_fixed_rate),
      bankOfCanadaPolicyRate: parseFloat(r.bank_of_canada_policy_rate),
      avgVariableRate: parseFloat(r.avg_variable_rate),
    })),
    skipDuplicates: true,
  });

  console.log('Seeding data sources...');
  const sources = [
    {
      key: 'cmhc_vacancy',
      name: 'CMHC Rental Market Survey — Vacancy Rates',
      description: 'Annual vacancy rates by bedroom type for Toronto CMA and Ontario, from the CMHC Rental Market Survey (RMS), published each November.',
      url: 'https://www.cmhc-schl.gc.ca/en/data-and-research/data-tables/rental-market-report',
      lastSyncStatus: 'pending',
    },
    {
      key: 'cmhc_rental',
      name: 'CMHC Rental Market Survey — Average Rents',
      description: 'Average monthly rents by bedroom type for Toronto CMA and Ontario, from the CMHC Rental Market Survey (RMS), published each November.',
      url: 'https://www.cmhc-schl.gc.ca/en/data-and-research/data-tables/rental-market-report',
      lastSyncStatus: 'pending',
    },
    {
      key: 'cmhc_housing_starts',
      name: 'CMHC Housing Now — Housing Starts',
      description: 'Monthly housing starts by dwelling type for Toronto CMA, from the CMHC Housing Now publication. Updated monthly.',
      url: 'https://www.cmhc-schl.gc.ca/en/data-and-research/data-tables/housing-starts-under-construction-completions',
      lastSyncStatus: 'pending',
    },
    {
      key: 'boc_rates',
      name: 'Bank of Canada — Interest Rates',
      description: 'Annual averages of the Bank Rate (policy rate proxy) and 5-year conventional mortgage rate, from the Bank of Canada Valet API.',
      url: 'https://www.bankofcanada.ca/rates/interest-rates/',
      lastSyncStatus: 'pending',
    },
    {
      key: 'statcan_population',
      name: 'Statistics Canada — Population & Immigration',
      description: 'Annual Ontario population estimates (table 17-10-0005-01) and national immigration components (table 17-10-0040-01), from Statistics Canada.',
      url: 'https://www150.statcan.gc.ca/n1/en/subjects/population_and_demography',
      lastSyncStatus: 'pending',
    },
    {
      key: 'trreb_home_prices',
      name: 'TRREB Market Watch — Home Prices',
      description: 'Average home prices by property type in Toronto. Updated manually — TRREB does not offer a public API.',
      url: 'https://trreb.ca/index.php/market-news/market-watch',
      lastSyncStatus: 'manual',
    },
  ];

  for (const source of sources) {
    await prisma.dataSource.upsert({
      where: { key: source.key },
      update: {},
      create: source,
    });
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
