import { ToolService } from './chat.tools.js';

const makePrisma = () => ({
  vacancyRate: { findMany: jest.fn().mockResolvedValue([]) },
  rentalPrice: { findMany: jest.fn().mockResolvedValue([]) },
  housingStart: { findMany: jest.fn().mockResolvedValue([]) },
  homePrice: { findMany: jest.fn().mockResolvedValue([]) },
  mortgageRate: { findMany: jest.fn().mockResolvedValue([]) },
  populationGrowth: { findMany: jest.fn().mockResolvedValue([]) },
  immigration: { findMany: jest.fn().mockResolvedValue([]) },
});

describe('ToolService', () => {
  let service: ToolService;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new ToolService(prisma as any);
  });

  it('get_vacancy_rates calls vacancyRate.findMany with geography filter', async () => {
    await service.run('get_vacancy_rates', { geography: 'Toronto CMA' });
    expect(prisma.vacancyRate.findMany).toHaveBeenCalledWith({
      where: { geography: 'Toronto CMA' },
      orderBy: { year: 'asc' },
    });
  });

  it('get_rental_prices calls rentalPrice.findMany with bedroomType filter', async () => {
    await service.run('get_rental_prices', { bedroomType: '2 Bedroom' });
    expect(prisma.rentalPrice.findMany).toHaveBeenCalledWith({
      where: { bedroomType: '2 Bedroom' },
      orderBy: { year: 'asc' },
    });
  });

  it('get_mortgage_rates calls mortgageRate.findMany', async () => {
    await service.run('get_mortgage_rates', {});
    expect(prisma.mortgageRate.findMany).toHaveBeenCalledWith({ orderBy: { year: 'asc' } });
  });

  it('get_immigration_data calls immigration.findMany', async () => {
    await service.run('get_immigration_data', {});
    expect(prisma.immigration.findMany).toHaveBeenCalledWith({ orderBy: { year: 'asc' } });
  });

  it('throws on unknown tool name', async () => {
    await expect(service.run('nonexistent_tool', {})).rejects.toThrow('Unknown tool');
  });
});
