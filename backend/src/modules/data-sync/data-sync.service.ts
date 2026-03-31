import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class DataSyncService implements OnModuleInit {
  private readonly logger = new Logger(DataSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Run once on startup in the background — does not block app startup
    setImmediate(() => this.syncAll());
  }

  @Cron('0 3 * * 1') // Every Monday at 3:00 AM
  async syncAll(): Promise<void> {
    this.logger.log('Data sync started');
    // Fetchers wired in Task 9
    this.logger.log('Data sync complete (no fetchers registered yet)');
  }

  async findAllSources() {
    return this.prisma.dataSource.findMany({ orderBy: { key: 'asc' } });
  }
}
