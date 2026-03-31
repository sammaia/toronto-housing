import { Controller, Get } from '@nestjs/common';
import { OverviewService } from './overview.service.js';

@Controller('api/v1/overview')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get('kpis')
  getKpis() {
    return this.overviewService.getKpis();
  }
}
