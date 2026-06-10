import { Controller, Post, Get, Body, Headers, ForbiddenException } from '@nestjs/common';
import { DemandService } from './demand.service';
import { UnserviceableRequestDto } from './dto/unserviceable-request.dto';

@Controller('demand')
export class DemandController {
  constructor(private readonly demandService: DemandService) {}

  /**
   * Log an unserviceable request (called by customer app when outside zone)
   * Note: This route should actually be open/accessible to customers via Gateway.
   * But we group it under admin-service because it's purely for admin consumption.
   * The Gateway needs to proxy /unserviceable-requests to /admin/v1/demand/log
   */
  @Post('log')
  async logRequest(
    @Headers('x-user-id') userId: string,
    @Body() dto: UnserviceableRequestDto
  ) {
    return this.demandService.logRequest(userId, dto);
  }

  /**
   * Admin: View demand log
   */
  @Get()
  async getDemandLog(@Headers('x-user-role') role: string) {
    if (role !== 'super_admin') {
      throw new ForbiddenException('Only super_admin can view demand logs');
    }
    return this.demandService.getDemandLog();
  }
}
