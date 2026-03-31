import { Controller, Get, Query } from '@nestjs/common';
import { HousingStartsService } from './housing-starts.service.js';

@Controller('api/v1/housing-starts')
export class HousingStartsController {
  constructor(private readonly housingStartsService: HousingStartsService) {}

  @Get()
  findAll(
    @Query('geography') geography?: string,
    @Query('dwellingType') dwellingType?: string,
    @Query('year') year?: string,
  ) {
    return this.housingStartsService.findAll({
      geography,
      dwellingType,
      year: year ? parseInt(year) : undefined,
    });
  }

  @Get('annual')
  findAnnualTotals(@Query('geography') geography?: string) {
    return this.housingStartsService.findAnnualTotals(geography);
  }
}
