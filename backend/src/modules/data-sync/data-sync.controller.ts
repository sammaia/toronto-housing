import { Controller, Get } from '@nestjs/common';
import { DataSyncService } from './data-sync.service.js';

@Controller('data-sources')
export class DataSyncController {
  constructor(private readonly dataSyncService: DataSyncService) {}

  @Get()
  findAll() {
    return this.dataSyncService.findAllSources();
  }
}
