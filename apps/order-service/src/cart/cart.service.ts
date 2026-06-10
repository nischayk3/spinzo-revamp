import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE_ORM, DrizzleDB } from '../drizzle/drizzle.module';
import { carts } from '@spinzo/db';
import { eq } from 'drizzle-orm';
import { UpsertCartDto } from './dto/upsert-cart.dto';

/**
 * Cart is stored as a JSONB column on a "carts" database table.
 * This is a persistent approach — the cart is stored in Postgres
 * and cleared on checkout.
 */
@Injectable()
export class CartService {
  constructor(@Inject(DRIZZLE_ORM) private db: DrizzleDB) {}

  /**
   * Get cart for user. Returns empty cart if none exists.
   */
  async getCart(userId: string) {
    const [cart] = await this.db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId));

    if (!cart) {
      return { userId, items: [], totalAmount: 0, updatedAt: null };
    }

    const items = (cart.items as any[]) || [];
    const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    return { userId, items, totalAmount, updatedAt: cart.updatedAt };
  }

  /**
   * Replace cart contents for user.
   * Called on every cart change from the frontend.
   */
  async upsertCart(userId: string, dto: UpsertCartDto) {
    const totalAmount = dto.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    const [cart] = await this.db
      .insert(carts)
      .values({
        userId,
        items: dto.items,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: carts.userId,
        set: {
          items: dto.items,
          updatedAt: new Date(),
        },
      })
      .returning();

    return { userId, items: cart.items, totalAmount, updatedAt: cart.updatedAt };
  }

  /**
   * Clear cart after successful checkout.
   */
  async clearCart(userId: string) {
    await this.db
      .delete(carts)
      .where(eq(carts.userId, userId));
    return { userId, items: [], totalAmount: 0, updatedAt: new Date() };
  }
}
