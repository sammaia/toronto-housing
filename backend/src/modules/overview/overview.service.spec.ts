import { Test } from '@nestjs/testing';
import { OverviewService } from './overview.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('OverviewService.getKpis', () => {
  let service: OverviewService;

  const mockPrisma = {
    vacancyRate: { findFirst: jest.fn() },
    rentalPrice: { findFirst: jest.fn() },
    mortgageRate: { findFirst: jest.fn() },
    homePrice: { findFirst: jest.fn() },
    populationGrowth: { findFirst: jest.fn() },
    immigration: { findFirst: jest.fn() },
    medianIncome: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OverviewService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(OverviewService);

    // Default happy-path stubs for fields not under test
    mockPrisma.vacancyRate.findFirst.mockResolvedValue({ vacancyRate: 1.5 });
    mockPrisma.mortgageRate.findFirst.mockResolvedValue({ avg5yrFixedRate: 5.25, bankOfCanadaPolicyRate: 4.75 });
    mockPrisma.homePrice.findFirst.mockResolvedValue({ avgPrice: 1480000 });
    mockPrisma.populationGrowth.findFirst.mockResolvedValue({ population: 6800000, yoyGrowthPct: 2.6 });
    mockPrisma.immigration.findFirst.mockResolvedValue({ newPermanentResidents: 141500 });
  });

  afterEach(() => jest.clearAllMocks());

  it('includes rentToIncome in KPI response', async () => {
    mockPrisma.rentalPrice.findFirst.mockResolvedValue({ averageRent: 2740, percentageChange: 4.2 });
    mockPrisma.medianIncome.findFirst.mockResolvedValue({ medianHouseholdIncome: 96000 });

    const result = await service.getKpis();

    // (2740 * 12) / 96000 * 100 = 34.25 → 34.3
    expect(result.rentToIncome).toBeCloseTo(34.3, 0);
  });

  it('includes priceToIncome in KPI response', async () => {
    mockPrisma.rentalPrice.findFirst.mockResolvedValue({ averageRent: 2740, percentageChange: 4.2 });
    mockPrisma.medianIncome.findFirst.mockResolvedValue({ medianHouseholdIncome: 96000 });

    const result = await service.getKpis();

    // 1480000 / 96000 = 15.4
    expect(result.priceToIncome).toBeCloseTo(15.4, 0);
  });

  it('returns null for ratios when medianIncome is missing', async () => {
    mockPrisma.rentalPrice.findFirst.mockResolvedValue({ averageRent: 2740, percentageChange: 4.2 });
    mockPrisma.medianIncome.findFirst.mockResolvedValue(null);

    const result = await service.getKpis();

    expect(result.rentToIncome).toBeNull();
    expect(result.priceToIncome).toBeNull();
  });
});
