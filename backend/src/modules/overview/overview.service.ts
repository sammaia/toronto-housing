import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpis() {
    const latestYear = 2024;

    const [vacancyRate, avgRent, mortgageRate, avgHomePrice, population, immigration, medianIncome] =
      await Promise.all([
        this.prisma.vacancyRate.findFirst({
          where: { year: latestYear, geography: 'Toronto CMA', bedroomType: 'Total' },
        }),
        this.prisma.rentalPrice.findFirst({
          where: { year: latestYear, geography: 'Toronto CMA', bedroomType: '2 Bedroom' },
        }),
        this.prisma.mortgageRate.findFirst({
          where: { year: latestYear },
        }),
        this.prisma.homePrice.findFirst({
          where: { year: latestYear, propertyType: 'detached' },
        }),
        this.prisma.populationGrowth.findFirst({
          where: { year: latestYear, region: 'toronto_cma' },
        }),
        this.prisma.immigration.findFirst({
          where: { year: latestYear },
        }),
        this.prisma.medianIncome.findFirst({
          where: { year: latestYear, region: 'toronto_cma' },
        }),
      ]);

    const rentToIncome =
      avgRent && medianIncome
        ? parseFloat(((avgRent.averageRent * 12) / medianIncome.medianHouseholdIncome * 100).toFixed(1))
        : null;

    const priceToIncome =
      avgHomePrice && medianIncome
        ? parseFloat((avgHomePrice.avgPrice / medianIncome.medianHouseholdIncome).toFixed(1))
        : null;

    return {
      vacancyRate: vacancyRate?.vacancyRate ?? null,
      avgRent2Bed: avgRent?.averageRent ?? null,
      rentChange: avgRent?.percentageChange ?? null,
      mortgageRate5yr: mortgageRate?.avg5yrFixedRate ?? null,
      policyRate: mortgageRate?.bankOfCanadaPolicyRate ?? null,
      avgDetachedPrice: avgHomePrice?.avgPrice ?? null,
      population: population?.population ?? null,
      populationGrowth: population?.yoyGrowthPct ?? null,
      newPermanentResidents: immigration?.newPermanentResidents ?? null,
      rentToIncome,
      priceToIncome,
      year: latestYear,
    };
  }
}
