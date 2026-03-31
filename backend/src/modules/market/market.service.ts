import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class MarketService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomePrices() {
    const rows = await this.prisma.homePrice.findMany({ orderBy: { year: 'asc' } });

    const byYear = new Map<number, Record<string, number>>();
    rows.forEach((row) => {
      if (!byYear.has(row.year)) {
        byYear.set(row.year, { year: row.year });
      }
      const entry = byYear.get(row.year)!;
      const key = row.propertyType === 'semi_detached' ? 'semiDetached' : row.propertyType;
      entry[key] = row.avgPrice;
    });

    return Array.from(byYear.values());
  }

  async getMortgageRates() {
    const rows = await this.prisma.mortgageRate.findMany({ orderBy: { year: 'asc' } });
    return rows.map((r) => ({
      year: r.year,
      fixed5yr: r.avg5yrFixedRate,
      variable: r.avgVariableRate,
      policyRate: r.bankOfCanadaPolicyRate,
    }));
  }

  async getPopulationGrowth(region?: string) {
    const rows = await this.prisma.populationGrowth.findMany({
      where: region ? { region } : undefined,
      orderBy: { year: 'asc' },
    });
    return rows.map((r) => ({
      year: r.year,
      region: r.region,
      population: r.population,
      growth: r.yoyGrowthPct,
    }));
  }

  async getImmigration() {
    return this.prisma.immigration.findMany({ orderBy: { year: 'asc' } });
  }
}
