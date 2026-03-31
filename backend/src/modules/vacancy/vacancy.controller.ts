import { Controller, Get, Query } from '@nestjs/common';
import { VacancyService } from './vacancy.service.js';

@Controller('api/v1/vacancy-rates')
export class VacancyController {
  constructor(private readonly vacancyService: VacancyService) {}

  @Get()
  findAll(
    @Query('geography') geography?: string,
    @Query('bedroomType') bedroomType?: string,
  ) {
    return this.vacancyService.findAll({ geography, bedroomType });
  }
}
