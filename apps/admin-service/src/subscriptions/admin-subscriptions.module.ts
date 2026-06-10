import { Module } from '@nestjs/common';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';

@Module({
  controllers: [AdminSubscriptionsController],
  providers: [AdminSubscriptionsService],
})
export class AdminSubscriptionsModule {}
