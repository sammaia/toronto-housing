import { Controller, Get, Query } from '@nestjs/common';
import { RentalService } from './rental.service.js';

@Controller('api/v1/rental-prices')
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  @Get()
  findAll(
    @Query('geography') geography?: string,
    @Query('bedroomType') bedroomType?: string,
  ) {
    return this.rentalService.findAll({ geography, bedroomType });
  }
}
