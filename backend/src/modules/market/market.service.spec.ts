import { Test } from '@nestjs/testing';
import { MarketService } from './market.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('MarketService.getMarketActivity', () => {
  let service: MarketService;

  const mockPrisma = {
    homePrice: { findMany: jest.fn() },
    mortgageRate: { findMany: jest.fn() },
    populationGrowth: { findMany: jest.fn() },
    immigration: { findMany: jest.fn() },
    marketActivity: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MarketService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(MarketService);
    jest.clearAllMocks();
  });

  it('returns market activity rows ordered by year', async () => {
    mockPrisma.marketActivity.findMany.mockResolvedValue([
      { year: 2022, totalSales: 75140, newListings: 184513, snlr: 40.7 },
      { year: 2023, totalSales: 65982, newListings: 166600, snlr: 39.6 },
    ]);

    const result = await service.getMarketActivity();

    expect(result).toEqual([
      { year: 2022, totalSales: 75140, newListings: 184513, snlr: 40.7 },
      { year: 2023, totalSales: 65982, newListings: 166600, snlr: 39.6 },
    ]);
    expect(mockPrisma.marketActivity.findMany).toHaveBeenCalledWith({
      orderBy: { year: 'asc' },
    });
  });

  it('returns empty array when no activity data exists', async () => {
    mockPrisma.marketActivity.findMany.mockResolvedValue([]);

    const result = await service.getMarketActivity();

    expect(result).toEqual([]);
  });
});
