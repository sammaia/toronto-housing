import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface AffordabilityRow {
  year: number;
  medianIncome: number;
  avgRent2Bed: number;
  avgDetachedPrice: number;
  rentToIncome: number;
  priceToIncome: number;
  housingStarts: number;
  estimatedDemand: number;
  supplyGap: number;
}

@Injectable()
export class AffordabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getAffordabilityTimeSeries(): Promise<AffordabilityRow[]> {
    const [incomes, rentals, prices, startsGrouped, populations] = await Promise.all([
      this.prisma.medianIncome.findMany({
        where: { region: 'toronto_cma' },
        orderBy: { year: 'asc' },
      }),
      this.prisma.rentalPrice.findMany({
        where: { geography: 'Toronto CMA', bedroomType: '2 Bedroom' },
        orderBy: { year: 'asc' },
      }),
      this.prisma.homePrice.findMany({
        where: { propertyType: 'detached' },
        orderBy: { year: 'asc' },
      }),
      this.prisma.housingStart.groupBy({
        by: ['year'],
        where: { geography: 'Toronto CMA' },
        _sum: { units: true },
        orderBy: { year: 'asc' },
      }),
      this.prisma.populationGrowth.findMany({
        where: { region: 'toronto_cma' },
        orderBy: { year: 'asc' },
      }),
    ]);

    const rentalByYear = new Map(rentals.map((r) => [r.year, r.averageRent]));
    const priceByYear = new Map(prices.map((p) => [p.year, p.avgPrice]));
    const startsByYear = new Map(startsGrouped.map((s) => [s.year, s._sum.units ?? 0]));
    const popByYear = new Map(populations.map((p) => [p.year, p]));

    return incomes
      .filter((inc) => rentalByYear.has(inc.year) && priceByYear.has(inc.year))
      .map((inc) => {
        const avgRent = rentalByYear.get(inc.year)!;
        const avgPrice = priceByYear.get(inc.year)!;
        const starts = startsByYear.get(inc.year) ?? 0;
        const pop = popByYear.get(inc.year);

        const estimatedDemand = pop
          ? Math.round((pop.population * (pop.yoyGrowthPct / 100)) / 2.5)
          : 0;

        return {
          year: inc.year,
          medianIncome: inc.medianHouseholdIncome,
          avgRent2Bed: avgRent,
          avgDetachedPrice: avgPrice,
          rentToIncome: parseFloat(((avgRent * 12) / inc.medianHouseholdIncome * 100).toFixed(1)),
          priceToIncome: parseFloat((avgPrice / inc.medianHouseholdIncome).toFixed(1)),
          housingStarts: starts,
          estimatedDemand,
          supplyGap: estimatedDemand - starts,
        };
      });
  }
}
