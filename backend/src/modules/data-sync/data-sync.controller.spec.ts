import { Test } from '@nestjs/testing';
import { DataSyncController } from './data-sync.controller.js';
import { DataSyncService } from './data-sync.service.js';

describe('DataSyncController', () => {
  let controller: DataSyncController;
  const mockService = {
    findAllSources: jest.fn().mockResolvedValue([
      { key: 'boc_rates', name: 'Bank of Canada', lastSyncStatus: 'success' },
    ]),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [DataSyncController],
      providers: [{ provide: DataSyncService, useValue: mockService }],
    }).compile();
    controller = module.get(DataSyncController);
  });

  it('returns all data sources', async () => {
    const result = await controller.findAll();
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('boc_rates');
  });
});
