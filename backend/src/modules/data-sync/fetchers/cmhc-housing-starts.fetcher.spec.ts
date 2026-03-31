import { Test } from '@nestjs/testing';
import { CmhcHousingStartsFetcher } from './cmhc-housing-starts.fetcher.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_CSV = `Year,Month,Survey Zone,Dwelling Type,Housing Starts
2025,1,Toronto CMA,Single,380
2025,1,Toronto CMA,Semi-Detached,71
2025,1,Toronto CMA,Row,195
2025,1,Toronto CMA,Apartment,2750
2017,1,Toronto CMA,Single,300
`;

describe('CmhcHousingStartsFetcher', () => {
  let fetcher: CmhcHousingStartsFetcher;
  const mockPrisma = { housingStart: { upsert: jest.fn() } };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CmhcHousingStartsFetcher,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    fetcher = module.get(CmhcHousingStartsFetcher);
    jest.clearAllMocks();
  });

  it('upserts housing start rows for Toronto CMA from 2018 onward', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          result: { resources: [{ format: 'CSV', url: 'https://example.com/starts.csv' }] },
        },
      })
      .mockResolvedValueOnce({ data: MOCK_CSV });

    await fetcher.fetch();

    expect(mockPrisma.housingStart.upsert).toHaveBeenCalledTimes(4);
    expect(mockPrisma.housingStart.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          year_month_geography_dwellingType: {
            year: 2025,
            month: 1,
            geography: 'Toronto CMA',
            dwellingType: 'Single',
          },
        }),
      }),
    );
  });

  it('skips rows before 2018', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { result: { resources: [{ format: 'CSV', url: 'https://example.com/starts.csv' }] } },
      })
      .mockResolvedValueOnce({ data: MOCK_CSV });

    await fetcher.fetch();

    // Only 4 rows from 2025 — the 2017 row is skipped
    expect(mockPrisma.housingStart.upsert).toHaveBeenCalledTimes(4);
  });
});
