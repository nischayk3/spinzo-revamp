import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { SlotsService } from './slots.service';

@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  /**
   * GET /order/v1/slots/availability?storeId=xxx&date=YYYY-MM-DD
   * Returns available time slots for pickup on a given date.
   */
  @Get('availability')
  async getAvailability(
    @Query('storeId') storeId: string,
    @Query('date') date: string,
  ) {
    if (!storeId) throw new BadRequestException('storeId is required');
    if (!date) throw new BadRequestException('date is required (YYYY-MM-DD)');

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }

    // Don't allow booking in the past
    const requestedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (requestedDate < today) {
      throw new BadRequestException('Cannot book slots in the past');
    }

    return this.slotsService.getAvailability(storeId, date);
  }
}
