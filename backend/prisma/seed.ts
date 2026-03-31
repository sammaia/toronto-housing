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
