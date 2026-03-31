import { Controller, Get, Query } from '@nestjs/common';
import { MarketService } from './market.service.js';

@Controller('api/v1/market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('home-prices')
  getHomePrices() {
    return this.marketService.getHomePrices();
  }

  @Get('mortgage-rates')
  getMortgageRates() {
    return this.marketService.getMortgageRates();
  }

  @Get('population')
  getPopulationGrowth(@Query('region') region?: string) {
    return this.marketService.getPopulationGrowth(region);
  }

  @Get('immigration')
  getImmigration() {
    return this.marketService.getImmigration();
  }
}
