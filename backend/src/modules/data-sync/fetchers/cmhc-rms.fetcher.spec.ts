import { Test } from '@nestjs/testing';
import { CmhcVacancyFetcher } from './cmhc-vacancy.fetcher.js';
import { CmhcRentalFetcher } from './cmhc-rental.fetcher.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_RMS_CSV = `Year,Survey Zone,Bedroom Type,Vacancy Rate (%),Average Rent ($),Universe
2025,Toronto CMA,Bachelor,2.1,1450,13200
2025,Toronto CMA,1 Bedroom,2.8,1820,68000
2025,Ontario,2 Bedroom,3.0,1650,190000
2017,Toronto CMA,Bachelor,0.7,1100,12000
`;

function setupMocks() {
  mockedAxios.get
    .mockResolvedValueOnce({
      data: { result: { resources: [{ format: 'CSV', url: 'https://example.com/rms.csv' }] } },
    })
    .mockResolvedValueOnce({ data: MOCK_RMS_CSV });
}

describe('CmhcVacancyFetcher', () => {
  let fetcher: CmhcVacancyFetcher;
  const mockPrisma = { vacancyRate: { upsert: jest.fn() } };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CmhcVacancyFetcher, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    fetcher = module.get(CmhcVacancyFetcher);
    jest.clearAllMocks();
  });

  it('upserts vacancy rates from 2018 onward', async () => {
    setupMocks();
    await fetcher.fetch();
    // 3 rows from 2025 (2017 row skipped)
    expect(mockPrisma.vacancyRate.upsert).toHaveBeenCalledTimes(3);
    expect(mockPrisma.vacancyRate.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          year_geography_bedroomType: { year: 2025, geography: 'Toronto CMA', bedroomType: 'Bachelor' },
        }),
      }),
    );
  });
});

describe('CmhcRentalFetcher', () => {
  let fetcher: CmhcRentalFetcher;
  const mockPrisma = { rentalPrice: { upsert: jest.fn() } };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CmhcRentalFetcher, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    fetcher = module.get(CmhcRentalFetcher);
    jest.clearAllMocks();
  });

  it('upserts rental prices from 2018 onward', async () => {
    setupMocks();
    await fetcher.fetch();
    expect(mockPrisma.rentalPrice.upsert).toHaveBeenCalledTimes(3);
  });
});
