import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE_ORM, DrizzleDB } from '../drizzle/drizzle.module';
import { orders, orderItems, dailySlots, users } from '@spinzo/db';
import { eq, and, desc } from 'drizzle-orm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { SlotsService } from '../slots/slots.service';
import { NotificationsService } from '../notifications/notifications.service';

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DRIZZLE_ORM) private db: DrizzleDB,
    private readonly slotsService: SlotsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Creates an order atomically:
   * 1. Reserves the pickup slot
   * 2. Creates the order record with pickup OTP
   * 3. Creates order item records
   * All or nothing — rolls back if slot is full.
   */
  async createOrder(userId: string, dto: CreateOrderDto) {
    const pickupOtp = generateOTP();
    const initialStatus = dto.paymentMethod === 'razorpay' ? 'pending_payment' : 'confirmed';

    const result = await this.db.transaction(async (tx) => {
      // 1. Reserve the slot
      const slotAvailable = await this.slotsService.reserveSlot(
        tx,
        dto.storeId,
        dto.pickupDate,
        dto.pickupTime,
      );

      if (!slotAvailable) {
        throw new BadRequestException(
          `Pickup slot ${dto.pickupTime} on ${dto.pickupDate} is fully booked. Please choose another slot.`,
        );
      }

      // 2. Create order
      const [order] = await tx
        .insert(orders)
        .values({
          userId,
          storeId: dto.storeId,
          status: initialStatus,
          pickupType: dto.pickupType,
          pickupDate: dto.pickupDate,
          pickupTime: dto.pickupTime,
          pickupOtp,
          address: dto.address,
          totalAmount: dto.totalAmount.toFixed(2),
          subscriptionId: dto.subscriptionId || null,
          paymentMethod: dto.paymentMethod,
          notes: dto.notes || null,
          billDetails: dto.billDetails || null,
        })
        .returning();

      // 3. Create order items
      if (dto.items && dto.items.length > 0) {
        await tx.insert(orderItems).values(
          dto.items.map((item) => ({
            orderId: order.id,
            serviceItemId: item.serviceItemId || null,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
            photos: item.photos || null,
          })),
        );
      }

      return order;
    });

    // Send order confirmation notification if confirmed immediately (e.g. COD or Subscription)
    if (initialStatus === 'confirmed') {
      try {
        const [user] = await this.db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (user && user.phone) {
          const name = user.name || 'Customer';
          await this.notificationsService.triggerOrderPlaced(
            userId,
            result.id,
            user.phone,
            name,
          );
        }
      } catch (err) {
        console.error('Failed to trigger order confirmation notification:', err);
      }
    }

    // Fetch full order with items for response
    return this.findById(result.id);
  }

  /**
   * Get all orders for a user, newest first.
   */
  async findByUser(userId: string) {
    const userOrders = await this.db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    // Enrich with items
    const enriched = await Promise.all(
      userOrders.map(async (order) => {
        const items = await this.db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));
        return { ...order, items };
      }),
    );

    return enriched;
  }

  /**
   * Get a single order by ID. Validates ownership.
   */
  async findById(orderId: string, userId?: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) throw new NotFoundException('Order not found');
    if (userId && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    return { ...order, items };
  }

  /**
   * Updates order status with full lifecycle enforcement.
   * Handles OTP verification, delivery OTP generation, token assignment,
   * and slot release on cancellation.
   */
  async updateStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    requestingUserId?: string,
    isAdmin?: boolean,
  ) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) throw new NotFoundException('Order not found');

    // Non-admin users can only cancel their own orders
    if (!isAdmin && requestingUserId && order.userId !== requestingUserId) {
      throw new ForbiddenException('Access denied');
    }

    const updates: Record<string, any> = {
      status: dto.status,
      updatedAt: new Date(),
    };

    // Pickup OTP verification (delivery partner confirms pickup)
    if (dto.verifyPickupOtp) {
      if (!dto.pickupOtp || dto.pickupOtp !== order.pickupOtp) {
        throw new BadRequestException('Invalid pickup OTP');
      }
      updates.pickupVerified = true;
      updates.pickedUpAt = new Date();
    }

    // Auto-generate delivery OTP when order becomes ready for delivery
    if (dto.status === 'ready' && !order.deliveryOtp) {
      updates.deliveryOtp = generateOTP();
    }

    // Delivery OTP verification (customer confirms delivery)
    if (dto.verifyDeliveryOtp) {
      if (!dto.deliveryOtp || dto.deliveryOtp !== order.deliveryOtp) {
        throw new BadRequestException('Invalid delivery OTP');
      }
      updates.deliveryVerified = true;
      updates.deliveredAt = new Date();
    }

    // Token number assignment (when processing begins at the store)
    if (dto.tokenNumber) {
      updates.tokenNumber = dto.tokenNumber;
    }

    // Cancellation
    if (dto.status === 'cancelled') {
      updates.cancellationReason = dto.cancellationReason || 'Cancelled by user';
      updates.cancelledAt = new Date();

      // Release the slot back to capacity
      if (order.pickupDate && order.pickupTime) {
        await this.slotsService.releaseSlot(
          order.storeId,
          order.pickupDate,
          order.pickupTime,
        );
      }
    }

    const [updated] = await this.db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, orderId))
      .returning();

    // Trigger WhatsApp notification if status changed
    if (dto.status !== order.status) {
      try {
        const [user] = await this.db
          .select()
          .from(users)
          .where(eq(users.id, order.userId));

        if (user && user.phone) {
          const name = user.name || 'Customer';
          if (dto.status === 'ready') {
            await this.notificationsService.triggerOrderReady(
              order.userId,
              orderId,
              user.phone,
              name,
            );
          } else if (dto.status === 'out_for_delivery') {
            await this.notificationsService.triggerOrderOutForDelivery(
              order.userId,
              orderId,
              user.phone,
              name,
            );
          }
        }
      } catch (err) {
        console.error(`Failed to trigger status change notification for status ${dto.status}:`, err);
      }
    }

    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    return { ...updated, items };
  }

  /**
   * Admin: Get ALL orders across all users, newest first.
   * Enriches with customer name + phone from users table.
   */
  async findAll(limit = 100, offset = 0) {
    const allOrders = await this.db
      .select({
        order: orders,
        customerName: users.name,
        customerPhone: users.phone,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const enriched = await Promise.all(
      allOrders.map(async ({ order, customerName, customerPhone }) => {
        const items = await this.db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          customerName: customerName || 'Unknown',
          customerPhone: customerPhone || '',
          items,
        };
      }),
    );

    return enriched;
  }
}
