import { Controller, Get, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DRIZZLE_ORM, DrizzleDB } from '../drizzle/drizzle.module';
import { users } from '@spinzo/db';
import { eq } from 'drizzle-orm';
import { Inject } from '@nestjs/common';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
    @Inject(DRIZZLE_ORM) private db: DrizzleDB,
  ) {}

  @Post('create-order')
  async createOrder(
    @Body('amount') amount: number,
    @Body('currency') currency = 'INR',
    @Body('type') type: 'order' | 'subscription',
    @Body('targetId') targetId: string,
  ) {
    if (!type || !targetId) {
      throw new BadRequestException('Type and TargetId are required');
    }
    return this.paymentsService.createRazorpayOrder(amount, currency, type, targetId);
  }

  @Post('verify')
  async verifyPayment(
    @Headers('x-user-id') userId: string,
    @Body('razorpayOrderId') razorpayOrderId: string,
    @Body('razorpayPaymentId') razorpayPaymentId: string,
    @Body('razorpaySignature') razorpaySignature: string,
    @Body('amount') amount: number,
    @Body('type') type: 'order' | 'subscription',
    @Body('targetId') targetId: string,
    @Body('credits') credits?: number,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required in headers');
    }
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !type || !targetId || !amount) {
      throw new BadRequestException('Missing payment verification details');
    }

    const verificationResult = await this.paymentsService.verifyPayment(
      userId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amount,
      type,
      targetId,
      credits,
    );

    // If verification succeeded and type is 'order', trigger order confirmation notification!
    if (verificationResult.success && type === 'order') {
      try {
        const [user] = await this.db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (user && user.phone) {
          const name = user.name || 'Customer';
          await this.notificationsService.triggerOrderPlaced(
            userId,
            targetId,
            user.phone,
            name,
          );
        }
      } catch (err) {
        console.error('Failed to trigger order confirmation notification after payment:', err);
      }
    }

    return verificationResult;
  }

  @Get('history')
  async getHistory(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required in headers');
    }
    return this.paymentsService.getPaymentsByUser(userId);
  }
}
