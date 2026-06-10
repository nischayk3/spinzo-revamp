import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE_ORM, DrizzleDB } from '../drizzle/drizzle.module';
import { payments, orders, users, subscriptions } from '@spinzo/db';
import { eq, and } from 'drizzle-orm';
import * as crypto from 'crypto';
import Razorpay = require('razorpay');

// Plan pricing matching subscription-service
const PLAN_PRICING: Record<string, { pricePerCredit: number; kgPerCredit: number }> = {
  single: { pricePerCredit: 399, kgPerCredit: 7 },
  couple: { pricePerCredit: 798, kgPerCredit: 14 },
};

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor(
    @Inject(DRIZZLE_ORM) private db: DrizzleDB,
    private readonly configService: ConfigService,
  ) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID') || 'mock_key_id';
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || 'mock_key_secret';

    this.razorpay = new Razorpay({
      key_id: this.keyId,
      key_secret: this.keySecret,
    });
  }

  /**
   * Create Razorpay Order
   * amount is in Rupees (converted to paise for Razorpay)
   */
  async createRazorpayOrder(amount: number, currency = 'INR', type: 'order' | 'subscription', targetId: string) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const amountInPaise = Math.round(amount * 100);
    const receipt = `rec_${Date.now()}_${targetId.substring(0, 5)}`;

    try {
      // For mock mode in local/test
      if (this.keyId === 'mock_key_id' || !this.keyId) {
        const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        console.log(`[PaymentsService] Mock Razorpay Order created: id=${mockOrderId}, amount=${amount}`);
        return {
          orderId: mockOrderId,
          currency,
          amount: amountInPaise,
          keyId: this.keyId,
          isMock: true,
        };
      }

      const order = (await this.razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt,
        payment_capture: true,
      })) as any;

      return {
        orderId: order.id,
        currency: order.currency,
        amount: order.amount,
        keyId: this.keyId,
        isMock: false,
      };
    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      throw new BadRequestException(error.message || 'Failed to create Razorpay order');
    }
  }

  /**
   * Verify Razorpay Payment Signature
   */
  async verifyPayment(
    userId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    amount: number,
    type: 'order' | 'subscription',
    targetId: string, // orderId or planType
    credits?: number, // for subscription
  ) {
    // 1. Verify signature if not in mock mode
    const isMock = this.keyId === 'mock_key_id' || razorpayOrderId.startsWith('order_mock_');
    if (!isMock) {
      const hmac = crypto.createHmac('sha256', this.keySecret);
      hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== razorpaySignature) {
        throw new BadRequestException('Invalid payment signature');
      }
    } else {
      console.log('[PaymentsService] Bypassing payment signature verification in mock mode');
    }

    // 2. Perform DB updates atomically
    return await this.db.transaction(async (tx) => {
      // Insert payment record
      const [payment] = await tx
        .insert(payments)
        .values({
          userId,
          orderId: type === 'order' ? targetId : null,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          amount: amount.toFixed(2),
          currency: 'INR',
          status: 'success',
          method: 'razorpay',
          createdAt: new Date(),
        })
        .returning();

      if (type === 'order') {
        // Update Order record
        const [order] = await tx
          .select()
          .from(orders)
          .where(eq(orders.id, targetId));

        if (!order) {
          throw new NotFoundException(`Order with ID ${targetId} not found`);
        }

        // Update status to confirmed if it was pending_payment, or keep it updated
        const orderStatus = order.status === 'pending_payment' ? 'confirmed' : order.status;

        await tx
          .update(orders)
          .set({
            status: orderStatus,
            paymentMethod: 'razorpay',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, targetId));

        // Note: Caller can trigger notifications using order details.
        return { success: true, paymentId: payment.id, orderId: targetId, orderStatus };
      } else if (type === 'subscription') {
        // Create subscription directly in database (Neon DB makes this easy since we share schema)
        const pricing = PLAN_PRICING[targetId]; // targetId is planType like 'single', 'couple'
        if (!pricing) {
          throw new BadRequestException(`Invalid plan type: ${targetId}`);
        }

        const planCredits = credits || 4; // default to 4 credits
        const { pricePerCredit, kgPerCredit } = pricing;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // Update user credits
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (user) {
          await tx
            .update(users)
            .set({
              credits: (user.credits || 0) + planCredits,
              subscriptionStatus: 'active',
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));
        }

        // Insert Subscription
        const [sub] = await tx
          .insert(subscriptions)
          .values({
            userId,
            planType: targetId,
            totalCredits: planCredits,
            creditsUsed: 0,
            creditsRemaining: planCredits,
            currentCreditIndex: 0,
            pricePerCredit: pricePerCredit.toString(),
            totalAmount: (pricePerCredit * planCredits).toString(),
            kgPerCredit: kgPerCredit.toString(),
            status: 'active',
            paymentId: payment.id,
            isActive: true,
            expiresAt,
            createdAt: new Date(),
            purchasedAt: new Date(),
          })
          .returning();

        return { success: true, paymentId: payment.id, subscriptionId: sub.id };
      }

      return { success: true, paymentId: payment.id };
    });
  }

  /**
   * Get payments for a user
   */
  async getPaymentsByUser(userId: string) {
    return this.db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(payments.createdAt);
  }
}
