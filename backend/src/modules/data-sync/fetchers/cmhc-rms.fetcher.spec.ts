import { Test } from '@nestjs/testing';
import { CmhcVacancyFetcher } from './cmhc-vacancy.fetcher.js';
import { CmhcRentalFetcher } from './cmhc-rental.fetcher.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import * as rmsFetcher from './cmhc-rms.fetcher.js';

jest.mock('./cmhc-rms.fetcher.js');
const mockedRmsFetcher = rmsFetcher as jest.Mocked<typeof rmsFetcher>;

const MOCK_VACANCY_CSV_ROWS = [
  { Year: '2025', 'Survey Zone': 'Toronto CMA', 'Bedroom Type': 'Bachelor', 'Vacancy Rate (%)': '2.1', Universe: '13200' },
  { Year: '2025', 'Survey Zone': 'Toronto CMA', 'Bedroom Type': '1 Bedroom', 'Vacancy Rate (%)': '2.8', Universe: '68000' },
  { Year: '2025', 'Survey Zone': 'Ontario', 'Bedroom Type': '2 Bedroom', 'Vacancy Rate (%)': '3.0', Universe: '190000' },
  { Year: '2017', 'Survey Zone': 'Toronto CMA', 'Bedroom Type': 'Bachelor', 'Vacancy Rate (%)': '0.7', Universe: '12000' },
];

const MOCK_RENTAL_CSV_ROWS = [
  { Year: '2025', 'Survey Zone': 'Toronto CMA', 'Bedroom Type': 'Bachelor', 'Average Rent ($)': '1450', '% Change in Average Rent (%)': '3.5' },
  { Year: '2025', 'Survey Zone': 'Toronto CMA', 'Bedroom Type': '1 Bedroom', 'Average Rent ($)': '1820', '% Change in Average Rent (%)': '2.1' },
  { Year: '2025', 'Survey Zone': 'Ontario', 'Bedroom Type': '2 Bedroom', 'Average Rent ($)': '1650', '% Change in Average Rent (%)': '1.8' },
  { Year: '2017', 'Survey Zone': 'Toronto CMA', 'Bedroom Type': 'Bachelor', 'Average Rent ($)': '1100', '% Change in Average Rent (%)': '0.0' },
];

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
    mockedRmsFetcher.downloadVacancyCsv.mockResolvedValueOnce(MOCK_VACANCY_CSV_ROWS);
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
    mockedRmsFetcher.downloadRentalCsv.mockResolvedValueOnce(MOCK_RENTAL_CSV_ROWS);
    await fetcher.fetch();
    expect(mockPrisma.rentalPrice.upsert).toHaveBeenCalledTimes(3);
  });
});
