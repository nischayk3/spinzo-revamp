import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  /**
   * GET /order/v1/catalog/services?storeId=xxx
   * Returns full service catalog with items.
   * storeId is optional — falls back to global catalog.
   */
  @Get('services')
  async getServices(@Query('storeId') storeId?: string) {
    return this.catalogService.getServices(storeId);
  }

  /**
   * GET /order/v1/catalog/services/:slug
   * Returns a single service category by slug (e.g. "wash_fold").
   */
  @Get('services/:slug')
  async getServiceBySlug(@Param('slug') slug: string) {
    return this.catalogService.getCategoryBySlug(slug);
  }
}
