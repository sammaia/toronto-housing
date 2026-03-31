import { Test } from '@nestjs/testing';
import { DataSyncService } from './data-sync.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { BocRatesFetcher } from './fetchers/boc-rates.fetcher.js';
import { CmhcHousingStartsFetcher } from './fetchers/cmhc-housing-starts.fetcher.js';
import { CmhcVacancyFetcher } from './fetchers/cmhc-vacancy.fetcher.js';
import { CmhcRentalFetcher } from './fetchers/cmhc-rental.fetcher.js';
import { StatcanFetcher } from './fetchers/statcan.fetcher.js';

describe('DataSyncService', () => {
  let service: DataSyncService;
  const mockPrisma = {
    dataSource: {
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  const makeFetcher = (key: string) => ({ sourceKey: key, fetch: jest.fn().mockResolvedValue(undefined) });
  const bocFetcher = makeFetcher('boc_rates');
  const startsFetcher = makeFetcher('cmhc_housing_starts');
  const vacancyFetcher = makeFetcher('cmhc_vacancy');
  const rentalFetcher = makeFetcher('cmhc_rental');
  const statcanFetcher = makeFetcher('statcan_population');

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DataSyncService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BocRatesFetcher, useValue: bocFetcher },
        { provide: CmhcHousingStartsFetcher, useValue: startsFetcher },
        { provide: CmhcVacancyFetcher, useValue: vacancyFetcher },
        { provide: CmhcRentalFetcher, useValue: rentalFetcher },
        { provide: StatcanFetcher, useValue: statcanFetcher },
      ],
    }).compile();
    service = module.get(DataSyncService);
    jest.clearAllMocks();
  });

  it('calls all 5 fetchers on syncAll()', async () => {
    await service.syncAll();
    expect(bocFetcher.fetch).toHaveBeenCalledTimes(1);
    expect(startsFetcher.fetch).toHaveBeenCalledTimes(1);
    expect(vacancyFetcher.fetch).toHaveBeenCalledTimes(1);
    expect(rentalFetcher.fetch).toHaveBeenCalledTimes(1);
    expect(statcanFetcher.fetch).toHaveBeenCalledTimes(1);
  });

  it('marks source as success when fetch completes', async () => {
    await service.syncAll();
    expect(mockPrisma.dataSource.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'boc_rates' },
        data: expect.objectContaining({ lastSyncStatus: 'success' }),
      }),
    );
  });

  it('marks source as failed when fetcher throws, but continues other fetchers', async () => {
    bocFetcher.fetch.mockRejectedValueOnce(new Error('network error'));
    await service.syncAll();

    expect(mockPrisma.dataSource.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'boc_rates' },
        data: expect.objectContaining({ lastSyncStatus: 'failed', errorMessage: 'network error' }),
      }),
    );
    expect(startsFetcher.fetch).toHaveBeenCalledTimes(1);
  });
});
