import { Test } from '@nestjs/testing';
import { StatcanFetcher } from './statcan.fetcher.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import axios from 'axios';
import AdmZip from 'adm-zip';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const POP_CSV = `REF_DATE,GEO,Age group,Sex,VALUE
2025-01-01,Ontario,All ages,Both sexes,15200000
2025-01-01,Toronto CMA,All ages,Both sexes,0
2017-01-01,Ontario,All ages,Both sexes,13900000
`;

const MIGRATION_CSV = `REF_DATE,GEO,Components of demographic growth,VALUE
2025,Canada,Immigrants,485000
2025,Canada,Net non-permanent residents,275000
2017,Canada,Immigrants,286000
`;

function makeZipBuffer(filename: string, content: string): Buffer {
  const AdmZipReal = jest.requireActual<typeof import('adm-zip')>('adm-zip');
  const zip = new AdmZipReal(undefined as unknown as string);
  zip.addFile(filename, Buffer.from(content));
  return zip.toBuffer();
}

describe('StatcanFetcher', () => {
  let fetcher: StatcanFetcher;
  const mockPrisma = {
    populationGrowth: { upsert: jest.fn() },
    immigration: { upsert: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [StatcanFetcher, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    fetcher = module.get(StatcanFetcher);
    jest.clearAllMocks();
  });

  it('upserts Ontario population from 2018 onward', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: makeZipBuffer('17100005-eng.csv', POP_CSV) })
      .mockResolvedValueOnce({ data: makeZipBuffer('17100040-eng.csv', MIGRATION_CSV) });

    await fetcher.fetch();

    expect(mockPrisma.populationGrowth.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ year_region: { year: 2025, region: 'ontario' } }),
      }),
    );
    // 2017 row should be skipped
    expect(mockPrisma.populationGrowth.upsert).toHaveBeenCalledTimes(1);
  });

  it('upserts immigration data from 2018 onward', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: makeZipBuffer('17100005-eng.csv', POP_CSV) })
      .mockResolvedValueOnce({ data: makeZipBuffer('17100040-eng.csv', MIGRATION_CSV) });

    await fetcher.fetch();

    expect(mockPrisma.immigration.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { year: 2025 },
        create: expect.objectContaining({ year: 2025, newPermanentResidents: 485000 }),
      }),
    );
  });
});
