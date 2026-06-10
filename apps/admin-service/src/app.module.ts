import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './drizzle/drizzle.module';
import { StatsModule } from './stats/stats.module';
import { DemandModule } from './demand/demand.module';
import { AdminSubscriptionsModule } from './subscriptions/admin-subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    StatsModule,
    DemandModule,
    AdminSubscriptionsModule,
  ],
})
export class AppModule {}
