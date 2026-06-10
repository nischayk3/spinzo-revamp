import { Controller, Get, Query, Headers, ForbiddenException } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  private checkSuperAdmin(role: string) {
    if (role !== 'super_admin') {
      throw new ForbiddenException('Only super_admin can access revenue and global stats');
    }
  }

  @Get()
  async getStats(
    @Headers('x-user-role') role: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    this.checkSuperAdmin(role);
    return this.statsService.getOrderStats(from, to);
  }

  @Get('revenue')
  async getRevenue(
    @Headers('x-user-role') role: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    this.checkSuperAdmin(role);
    return this.statsService.getRevenue(from, to);
  }
}
