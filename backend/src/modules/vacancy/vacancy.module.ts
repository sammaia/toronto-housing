import { Module } from '@nestjs/common';
import { VacancyController } from './vacancy.controller.js';
import { VacancyService } from './vacancy.service.js';

@Module({
  controllers: [VacancyController],
  providers: [VacancyService],
})
export class VacancyModule {}
