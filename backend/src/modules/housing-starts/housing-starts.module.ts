import { Module } from '@nestjs/common';
import { HousingStartsController } from './housing-starts.controller.js';
import { HousingStartsService } from './housing-starts.service.js';

@Module({
  controllers: [HousingStartsController],
  providers: [HousingStartsService],
})
export class HousingStartsModule {}
