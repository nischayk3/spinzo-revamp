import { Controller, Get, Put, Delete, Body, Headers } from '@nestjs/common';
import { CartService } from './cart.service';
import { UpsertCartDto } from './dto/upsert-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Headers('x-user-id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Put()
  async upsertCart(
    @Headers('x-user-id') userId: string,
    @Body() dto: UpsertCartDto,
  ) {
    return this.cartService.upsertCart(userId, dto);
  }

  @Delete()
  async clearCart(@Headers('x-user-id') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
