import { Test } from '@nestjs/testing';
import { BocRatesFetcher } from './boc-rates.fetcher.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BocRatesFetcher', () => {
  let fetcher: BocRatesFetcher;
  const mockPrisma = { mortgageRate: { upsert: jest.fn() } };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BocRatesFetcher,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    fetcher = module.get(BocRatesFetcher);
    jest.clearAllMocks();
  });

  it('upserts annual averages from BoC observations', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        observations: [
          { d: '2024-01-17', V39079: { v: '5.00' }, V80691311: { v: '7.20' } },
          { d: '2024-06-05', V39079: { v: '4.75' }, V80691311: { v: '6.90' } },
          { d: '2024-12-11', V39079: { v: '3.25' }, V80691311: { v: '6.24' } },
        ],
      },
    });

    await fetcher.fetch();

    expect(mockPrisma.mortgageRate.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { year: 2024 },
        create: expect.objectContaining({
          year: 2024,
          bankOfCanadaPolicyRate: expect.any(Number),
          avg5yrFixedRate: expect.any(Number),
          avgVariableRate: expect.any(Number),
        }),
      }),
    );
  });

  it('skips observations before 2018', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        observations: [
          { d: '2017-12-06', V39079: { v: '1.00' }, V80691311: { v: '4.89' } },
        ],
      },
    });

    await fetcher.fetch();

    expect(mockPrisma.mortgageRate.upsert).not.toHaveBeenCalled();
  });

  it('skips rows with nan values', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        observations: [
          { d: '2024-01-01', V39079: { v: 'nan' }, V80691311: { v: 'nan' } },
        ],
      },
    });

    await fetcher.fetch();

    expect(mockPrisma.mortgageRate.upsert).not.toHaveBeenCalled();
  });
});
