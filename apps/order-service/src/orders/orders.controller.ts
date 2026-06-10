import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Req,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Headers,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * POST /order/v1/orders
   * Create a new order. User ID comes from Gateway via x-user-id header.
   */
  @Post()
  async createOrder(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(userId, dto);
  }

  /**
   * GET /order/v1/orders
   * Get all orders for the authenticated user.
   */
  @Get()
  async getMyOrders(@Headers('x-user-id') userId: string) {
    return this.ordersService.findByUser(userId);
  }

  /**
   * GET /order/v1/orders/all?limit=50&offset=0
   * Admin: Get all orders across all users.
   * The x-user-role header is set by Gateway after role validation.
   */
  @Get('all')
  async getAllOrders(
    @Headers('x-user-role') role: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.ordersService.findAll(limit, offset);
  }

  /**
   * GET /order/v1/orders/:id
   * Get a specific order. Validates ownership unless admin.
   */
  @Get(':id')
  async getOrder(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ) {
    const isAdmin = ['super_admin', 'store_admin', 'delivery_partner'].includes(role);
    return this.ordersService.findById(id, isAdmin ? undefined : userId);
  }

  /**
   * PUT /order/v1/orders/:id/status
   * Update order status. Used by delivery partners, admins, and customers (cancel only).
   */
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ) {
    const isAdmin = ['super_admin', 'store_admin', 'delivery_partner'].includes(role);
    return this.ordersService.updateStatus(id, dto, userId, isAdmin);
  }
}
