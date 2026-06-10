import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_ORM, DrizzleDB } from '../drizzle/drizzle.module';
import { subscriptions, users } from '@spinzo/db';
import { eq, desc } from 'drizzle-orm';
import { AddCreditsDto } from './dto/add-credits.dto';
import axios from 'axios';

@Injectable()
export class AdminSubscriptionsService {
  constructor(@Inject(DRIZZLE_ORM) private db: DrizzleDB) {}

  async getAll() {
    const allSubs = await this.db
      .select({
        subscription: subscriptions,
        customerName: users.name,
        customerPhone: users.phone,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.createdAt));

    return allSubs.map(({ subscription, customerName, customerPhone }) => ({
      ...subscription,
      customerName: customerName || 'Unknown',
      customerPhone: customerPhone || '',
    }));
  }

  async addCredits(dto: AddCreditsDto) {
    // 1. Find user by phone
    const [user] = await this.db.select().from(users).where(eq(users.phone, dto.phone));
    if (!user) throw new NotFoundException('User with this phone number not found');

    // 2. We use the subscription-service to actually create it so logic stays centralized.
    // In a real microservices setup, we'd use a message queue or internal gRPC.
    // For now, we'll do an internal HTTP call to the subscription service.
    try {
      const SUBSCRIPTION_SERVICE_URL = process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3004';
      const response = await axios.post(
        `${SUBSCRIPTION_SERVICE_URL}/subscription/v1/subscriptions`,
        {
          planType: dto.planType,
          totalCredits: dto.credits,
        },
        {
          headers: { 'x-user-id': user.id },
        }
      );
      
      return { success: true, subscription: response.data };
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new BadRequestException('User already has an active subscription');
      }
      throw new Error(`Failed to add credits: ${error.message}`);
    }
  }
}
