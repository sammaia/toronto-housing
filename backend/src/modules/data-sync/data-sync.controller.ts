import { Controller, Get, Post, HttpCode } from '@nestjs/common';
import { DataSyncService } from './data-sync.service.js';

@Controller('api/v1/data-sources')
export class DataSyncController {
  constructor(private readonly dataSyncService: DataSyncService) {}

  @Get()
  findAll() {
    return this.dataSyncService.findAllSources();
  }

  @Post('sync')
  @HttpCode(202)
  triggerSync() {
    void this.dataSyncService.syncAll();
    return { message: 'Sync started' };
  }
}
