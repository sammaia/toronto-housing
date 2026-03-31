import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { VacancyModule } from './modules/vacancy/vacancy.module.js';
import { RentalModule } from './modules/rental/rental.module.js';
import { HousingStartsModule } from './modules/housing-starts/housing-starts.module.js';
import { MarketModule } from './modules/market/market.module.js';
import { OverviewModule } from './modules/overview/overview.module.js';
import { ChatModule } from './modules/chat/chat.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    VacancyModule,
    RentalModule,
    HousingStartsModule,
    MarketModule,
    OverviewModule,
    ChatModule,
  ],
})
export class AppModule {}
