import { Module } from '@nestjs/common';
import { AffordabilityController } from './affordability.controller.js';
import { AffordabilityService } from './affordability.service.js';

@Module({
  controllers: [AffordabilityController],
  providers: [AffordabilityService],
})
export class AffordabilityModule {}
