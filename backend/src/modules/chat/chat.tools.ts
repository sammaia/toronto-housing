import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type Anthropic from '@anthropic-ai/sdk';

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: 'get_vacancy_rates',
    description: 'Get CMHC rental vacancy rate data. Returns year, geography, bedroomType, vacancyRate.',
    input_schema: {
      type: 'object' as const,
      properties: {
        year: { type: 'number', description: 'Filter by specific year, e.g. 2023' },
        geography: { type: 'string', description: '"Toronto CMA" or "Ontario"' },
        bedroomType: { type: 'string', description: 'Total, Bachelor, 1 Bedroom, 2 Bedroom, 3 Bedroom+' },
      },
      required: [],
    },
  },
  {
    name: 'get_rental_prices',
    description: 'Get average monthly rent data from CMHC. Returns year, geography, bedroomType, averageRent, percentageChange.',
    input_schema: {
      type: 'object' as const,
      properties: {
        year: { type: 'number', description: 'Filter by specific year' },
        geography: { type: 'string', description: '"Toronto CMA" or "Ontario"' },
        bedroomType: { type: 'string', description: 'Total, Bachelor, 1 Bedroom, 2 Bedroom, 3 Bedroom+' },
      },
      required: [],
    },
  },
  {
    name: 'get_housing_starts',
    description: 'Get monthly housing starts data by dwelling type. Returns year, month, geography, dwellingType, units.',
    input_schema: {
      type: 'object' as const,
      properties: {
        year: { type: 'number', description: 'Filter by specific year' },
        geography: { type: 'string', description: '"Toronto CMA" or "Ontario"' },
        dwellingType: { type: 'string', description: 'Single, Semi-Detached, Row, Apartment' },
      },
      required: [],
    },
  },
  {
    name: 'get_housing_starts_annual',
    description: 'Get annual housing starts totals by dwelling type. Best for trend analysis.',
    input_schema: {
      type: 'object' as const,
      properties: {
        geography: { type: 'string', description: '"Toronto CMA" (default) or "Ontario"' },
      },
      required: [],
    },
  },
  {
    name: 'get_home_prices',
    description: 'Get average home sale prices by property type (detached, condo, townhouse, semi-detached) per year.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_mortgage_rates',
    description: 'Get historical mortgage rates: 5-yr fixed, variable, and Bank of Canada policy rate per year.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_population_data',
    description: 'Get population and annual growth rate data.',
    input_schema: {
      type: 'object' as const,
      properties: {
        region: { type: 'string', description: 'Filter by region name' },
      },
      required: [],
    },
  },
  {
    name: 'get_immigration_data',
    description: 'Get annual new permanent residents and temporary residents data.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_kpis',
    description: 'Get the latest snapshot KPIs: vacancy rate, average 2-bed rent, 5-yr mortgage rate, policy rate.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
];

@Injectable()
export class ToolService {
  constructor(private readonly prisma: PrismaService) {}

  async run(toolName: string, input: Record<string, unknown>): Promise<unknown> {
    switch (toolName) {
      case 'get_vacancy_rates': {
        const where: Record<string, unknown> = {};
        if (input.year) where.year = Number(input.year);
        if (input.geography) where.geography = input.geography;
        if (input.bedroomType) where.bedroomType = input.bedroomType;
        return this.prisma.vacancyRate.findMany({ where, orderBy: { year: 'asc' } });
      }

      case 'get_rental_prices': {
        const where: Record<string, unknown> = {};
        if (input.year) where.year = Number(input.year);
        if (input.geography) where.geography = input.geography;
        if (input.bedroomType) where.bedroomType = input.bedroomType;
        return this.prisma.rentalPrice.findMany({ where, orderBy: { year: 'asc' } });
      }

      case 'get_housing_starts': {
        const where: Record<string, unknown> = {};
        if (input.year) where.year = Number(input.year);
        if (input.geography) where.geography = input.geography;
        if (input.dwellingType) where.dwellingType = input.dwellingType;
        return this.prisma.housingStart.findMany({
          where,
          orderBy: [{ year: 'asc' }, { month: 'asc' }],
        });
      }

      case 'get_housing_starts_annual': {
        const geography = (input.geography as string | undefined) ?? 'Toronto CMA';
        const rows = await this.prisma.housingStart.findMany({
          where: { geography },
          orderBy: [{ year: 'asc' }, { month: 'asc' }],
        });
        const byYearType = new Map<string, number>();
        rows.forEach((r) => {
          const key = `${r.year}-${r.dwellingType}`;
          byYearType.set(key, (byYearType.get(key) ?? 0) + r.units);
        });
        const years = [...new Set(rows.map((r) => r.year))].sort();
        const types = [...new Set(rows.map((r) => r.dwellingType))];
        return years.map((year) => {
          const entry: Record<string, unknown> = { year };
          types.forEach((type) => { entry[type] = byYearType.get(`${year}-${type}`) ?? 0; });
          return entry;
        });
      }

      case 'get_home_prices': {
        const rows = await this.prisma.homePrice.findMany({ orderBy: { year: 'asc' } });
        const byYear = new Map<number, Record<string, unknown>>();
        rows.forEach((r) => {
          if (!byYear.has(r.year)) byYear.set(r.year, { year: r.year });
          const entry = byYear.get(r.year)!;
          const key = r.propertyType === 'semi_detached' ? 'semiDetached' : r.propertyType;
          entry[key] = r.avgPrice;
        });
        return Array.from(byYear.values());
      }

      case 'get_mortgage_rates': {
        const rows = await this.prisma.mortgageRate.findMany({ orderBy: { year: 'asc' } });
        return rows.map((r) => ({
          year: r.year,
          fixed5yr: r.avg5yrFixedRate,
          variable: r.avgVariableRate,
          policyRate: r.bankOfCanadaPolicyRate,
        }));
      }

      case 'get_population_data': {
        const where = input.region ? { region: input.region as string } : undefined;
        const rows = await this.prisma.populationGrowth.findMany({
          where,
          orderBy: { year: 'asc' },
        });
        return rows.map((r) => ({
          year: r.year,
          region: r.region,
          population: r.population,
          growthPct: r.yoyGrowthPct,
        }));
      }

      case 'get_immigration_data':
        return this.prisma.immigration.findMany({ orderBy: { year: 'asc' } });

      case 'get_kpis': {
        const [vacancy, rent, mortgage] = await Promise.all([
          this.prisma.vacancyRate.findFirst({
            where: { geography: 'Toronto CMA', bedroomType: 'Total' },
            orderBy: { year: 'desc' },
          }),
          this.prisma.rentalPrice.findFirst({
            where: { geography: 'Toronto CMA', bedroomType: '2 Bedroom' },
            orderBy: { year: 'desc' },
          }),
          this.prisma.mortgageRate.findFirst({ orderBy: { year: 'desc' } }),
        ]);
        return { vacancy, rent, mortgage };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
