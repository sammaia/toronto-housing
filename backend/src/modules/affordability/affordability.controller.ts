import { Controller, Get } from '@nestjs/common';
import { AffordabilityService } from './affordability.service.js';

@Controller('api/v1/affordability')
export class AffordabilityController {
  constructor(private readonly affordabilityService: AffordabilityService) {}

  @Get()
  getTimeSeries() {
    return this.affordabilityService.getAffordabilityTimeSeries();
  }
}
