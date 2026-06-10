import { Injectable, Inject, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { DRIZZLE_ORM, DrizzleDB } from '../drizzle/drizzle.module';
import { subscriptions, creditUsage } from '@spinzo/db';
import { eq, and, desc } from 'drizzle-orm';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UseCreditDto } from './dto/use-credit.dto';

// Pricing from the live app
const PLAN_PRICING: Record<string, { pricePerCredit: number; kgPerCredit: number }> = {
  single: { pricePerCredit: 399, kgPerCredit: 7 },
  couple: { pricePerCredit: 798, kgPerCredit: 14 },
};

@Injectable()
export class SubscriptionsService {
  constructor(@Inject(DRIZZLE_ORM) private db: DrizzleDB) {}

  async create(userId: string, dto: CreateSubscriptionDto) {
    // Check no existing active subscription
    const existing = await this.db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active'))
    });
    if (existing) throw new ConflictException('Active subscription already exists');

    const pricing = PLAN_PRICING[dto.planType];
    if (!pricing) throw new BadRequestException('Invalid plan type');

    const { pricePerCredit, kgPerCredit } = pricing;
    const expiresAt = new Date(); 
    expiresAt.setDate(expiresAt.getDate() + 30);

    const [sub] = await this.db.insert(subscriptions).values({
      userId,
      planType: dto.planType,
      totalCredits: dto.totalCredits,
      creditsUsed: 0,
      creditsRemaining: dto.totalCredits,
      currentCreditIndex: 0,
      pricePerCredit: pricePerCredit.toString(),
      totalAmount: (pricePerCredit * dto.totalCredits).toString(),
      kgPerCredit: kgPerCredit.toString(),
      status: 'active',
      isActive: true,
      expiresAt,
    }).returning();
    
    return sub;
  }

  async getActive(userId: string) {
    const sub = await this.db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active'))
    });
    if (!sub) throw new NotFoundException('No active subscription found');
    return sub;
  }

  async getHistory(userId: string) {
    return await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async useCredit(userId: string, subscriptionId: string, dto: UseCreditDto) {
    return await this.db.transaction(async (tx) => {
      const sub = await tx.query.subscriptions.findFirst({
        where: and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId))
      });
      
      if (!sub) throw new NotFoundException('Subscription not found');
      if (sub.status !== 'active') throw new BadRequestException('No active subscription');
      if (sub.creditsRemaining <= 0) throw new BadRequestException('No credits remaining');

      // Log usage
      await tx.insert(creditUsage).values({
        subscriptionId, 
        userId,
        creditIndex: sub.currentCreditIndex,
        orderId: dto.orderId || null,
      });

      // Update subscription
      const newRemaining = sub.creditsRemaining - 1;
      const [updated] = await tx.update(subscriptions).set({
        creditsUsed: sub.creditsUsed + 1,
        creditsRemaining: newRemaining,
        currentCreditIndex: sub.currentCreditIndex + 1,
        status: newRemaining === 0 ? 'completed' : 'active',
        isActive: newRemaining > 0,
      }).where(eq(subscriptions.id, subscriptionId)).returning();

      return { success: true, subscription: updated };
    });
  }
}
