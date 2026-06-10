import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE_ORM, DrizzleDB } from '../drizzle/drizzle.module';
import { orders, subscriptions } from '@spinzo/db';
import { sql, gte, lte, and } from 'drizzle-orm';

@Injectable()
export class StatsService {
  constructor(@Inject(DRIZZLE_ORM) private db: DrizzleDB) {}

  async getOrderStats(fromDate?: string, toDate?: string) {
    let whereCondition = undefined;
    
    if (fromDate && toDate) {
      whereCondition = and(
        gte(orders.createdAt, new Date(fromDate)),
        lte(orders.createdAt, new Date(toDate + 'T23:59:59.999Z'))
      );
    }

    const results = await this.db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .where(whereCondition)
      .groupBy(orders.status);

    const stats = {
      total: 0,
      confirmed: 0,
      pickup_completed: 0,
      processing: 0,
      ready: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const row of results) {
      const count = Number(row.count);
      stats.total += count;
      if (stats.hasOwnProperty(row.status)) {
        (stats as any)[row.status] = count;
      }
    }

    return stats;
  }

  async getRevenue(fromDate?: string, toDate?: string) {
    let orderWhere = undefined;
    let subWhere = undefined;

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate + 'T23:59:59.999Z');
      orderWhere = and(gte(orders.createdAt, from), lte(orders.createdAt, to));
      subWhere = and(gte(subscriptions.createdAt, from), lte(subscriptions.createdAt, to));
    }

    const [orderRevenue] = await this.db
      .select({
        total: sql<number>`sum(CAST(${orders.totalAmount} AS NUMERIC))`,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .where(orderWhere);

    const [subRevenue] = await this.db
      .select({
        total: sql<number>`sum(CAST(${subscriptions.totalAmount} AS NUMERIC))`,
        count: sql<number>`count(*)`,
      })
      .from(subscriptions)
      .where(subWhere);

    const orderRev = Number(orderRevenue?.total || 0);
    const subRev = Number(subRevenue?.total || 0);

    return {
      revenue: orderRev + subRev,
      orderRevenue: orderRev,
      subscriptionRevenue: subRev,
      orderCount: Number(orderRevenue?.count || 0),
      subscriptionCount: Number(subRevenue?.count || 0),
    };
  }
}
