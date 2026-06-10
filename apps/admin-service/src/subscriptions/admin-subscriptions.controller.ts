import { Controller, Get, Post, Body, Headers, ForbiddenException } from '@nestjs/common';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { AddCreditsDto } from './dto/add-credits.dto';

@Controller('subscriptions')
export class AdminSubscriptionsController {
  constructor(private readonly adminSubscriptionsService: AdminSubscriptionsService) {}

  private checkSuperAdmin(role: string) {
    if (role !== 'super_admin') {
      throw new ForbiddenException('Only super_admin can manage subscriptions');
    }
  }

  @Get()
  async getAll(@Headers('x-user-role') role: string) {
    this.checkSuperAdmin(role);
    return this.adminSubscriptionsService.getAll();
  }

  @Post('add-credits')
  async addCredits(
    @Headers('x-user-role') role: string,
    @Body() dto: AddCreditsDto
  ) {
    this.checkSuperAdmin(role);
    return this.adminSubscriptionsService.addCredits(dto);
  }
}
