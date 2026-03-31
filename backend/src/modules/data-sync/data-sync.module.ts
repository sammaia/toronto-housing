import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { DataSyncService } from './data-sync.service.js';
import { DataSyncController } from './data-sync.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [DataSyncService],
  controllers: [DataSyncController],
})
export class DataSyncModule {}
