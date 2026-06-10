import { Controller, Get, Post, Body, Param, Headers } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UseCreditDto } from './dto/use-credit.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  async create(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateSubscriptionDto
  ) {
    return this.subscriptionsService.create(userId, dto);
  }

  @Get('active')
  async getActive(@Headers('x-user-id') userId: string) {
    return this.subscriptionsService.getActive(userId);
  }

  @Get()
  async getHistory(@Headers('x-user-id') userId: string) {
    return this.subscriptionsService.getHistory(userId);
  }

  @Post(':id/use-credit')
  async useCredit(
    @Param('id') subscriptionId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: UseCreditDto
  ) {
    return this.subscriptionsService.useCredit(userId, subscriptionId, dto);
  }
}
