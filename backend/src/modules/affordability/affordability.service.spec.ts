import { Test } from '@nestjs/testing';
import { AffordabilityService } from './affordability.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('AffordabilityService', () => {
  let service: AffordabilityService;

  const mockPrisma = {
    medianIncome: { findMany: jest.fn() },
    rentalPrice: { findMany: jest.fn() },
    homePrice: { findMany: jest.fn() },
    housingStart: { groupBy: jest.fn() },
    populationGrowth: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AffordabilityService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(AffordabilityService);
    jest.clearAllMocks();
  });

  it('calculates rentToIncome as (avgRent * 12 / medianIncome) * 100', async () => {
    mockPrisma.medianIncome.findMany.mockResolvedValue([
      { year: 2024, region: 'toronto_cma', medianHouseholdIncome: 96000 },
    ]);
    mockPrisma.rentalPrice.findMany.mockResolvedValue([
      { year: 2024, geography: 'Toronto CMA', bedroomType: '2 Bedroom', averageRent: 2740 },
    ]);
    mockPrisma.homePrice.findMany.mockResolvedValue([
      { year: 2024, propertyType: 'detached', avgPrice: 1480000 },
    ]);
    mockPrisma.housingStart.groupBy.mockResolvedValue([
      { year: 2024, _sum: { units: 42300 } },
    ]);
    mockPrisma.populationGrowth.findMany.mockResolvedValue([
      { year: 2024, region: 'toronto_cma', population: 6800000, yoyGrowthPct: 2.6 },
    ]);

    const result = await service.getAffordabilityTimeSeries();

    expect(result).toHaveLength(1);
    // (2740 * 12) / 96000 * 100 = 34.25 → rounds to 34.3
    expect(result[0].rentToIncome).toBeCloseTo(34.3, 0);
  });

  it('calculates priceToIncome as avgDetachedPrice / medianIncome', async () => {
    mockPrisma.medianIncome.findMany.mockResolvedValue([
      { year: 2024, region: 'toronto_cma', medianHouseholdIncome: 96000 },
    ]);
    mockPrisma.rentalPrice.findMany.mockResolvedValue([
      { year: 2024, geography: 'Toronto CMA', bedroomType: '2 Bedroom', averageRent: 2740 },
    ]);
    mockPrisma.homePrice.findMany.mockResolvedValue([
      { year: 2024, propertyType: 'detached', avgPrice: 1480000 },
    ]);
    mockPrisma.housingStart.groupBy.mockResolvedValue([
      { year: 2024, _sum: { units: 42300 } },
    ]);
    mockPrisma.populationGrowth.findMany.mockResolvedValue([
      { year: 2024, region: 'toronto_cma', population: 6800000, yoyGrowthPct: 2.6 },
    ]);

    const result = await service.getAffordabilityTimeSeries();

    // 1480000 / 96000 = 15.42 → 15.4
    expect(result[0].priceToIncome).toBeCloseTo(15.4, 0);
  });

  it('calculates supplyGap as estimatedDemand - housingStarts', async () => {
    mockPrisma.medianIncome.findMany.mockResolvedValue([
      { year: 2024, region: 'toronto_cma', medianHouseholdIncome: 96000 },
    ]);
    mockPrisma.rentalPrice.findMany.mockResolvedValue([
      { year: 2024, geography: 'Toronto CMA', bedroomType: '2 Bedroom', averageRent: 2740 },
    ]);
    mockPrisma.homePrice.findMany.mockResolvedValue([
      { year: 2024, propertyType: 'detached', avgPrice: 1480000 },
    ]);
    // population 6,800,000 * 2.6% / 2.5 = 70,720 estimated demand
    mockPrisma.housingStart.groupBy.mockResolvedValue([
      { year: 2024, _sum: { units: 42300 } },
    ]);
    mockPrisma.populationGrowth.findMany.mockResolvedValue([
      { year: 2024, region: 'toronto_cma', population: 6800000, yoyGrowthPct: 2.6 },
    ]);

    const result = await service.getAffordabilityTimeSeries();

    // estimatedDemand = round(6800000 * 0.026 / 2.5) = round(70720) = 70720
    // supplyGap = 70720 - 42300 = 28420
    expect(result[0].estimatedDemand).toBe(70720);
    expect(result[0].supplyGap).toBe(28420);
  });

  it('excludes years with no income data', async () => {
    mockPrisma.medianIncome.findMany.mockResolvedValue([]);
    mockPrisma.rentalPrice.findMany.mockResolvedValue([
      { year: 2024, geography: 'Toronto CMA', bedroomType: '2 Bedroom', averageRent: 2740 },
    ]);
    mockPrisma.homePrice.findMany.mockResolvedValue([
      { year: 2024, propertyType: 'detached', avgPrice: 1480000 },
    ]);
    mockPrisma.housingStart.groupBy.mockResolvedValue([]);
    mockPrisma.populationGrowth.findMany.mockResolvedValue([]);

    const result = await service.getAffordabilityTimeSeries();

    expect(result).toHaveLength(0);
  });
});
