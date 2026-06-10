import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE_ORM, DrizzleDB } from '../drizzle/drizzle.module';
import { unserviceableRequests } from '@spinzo/db';
import { UnserviceableRequestDto } from './dto/unserviceable-request.dto';
import { desc } from 'drizzle-orm';

@Injectable()
export class DemandService {
  constructor(@Inject(DRIZZLE_ORM) private db: DrizzleDB) {}

  async logRequest(userId: string, dto: UnserviceableRequestDto) {
    await this.db.insert(unserviceableRequests).values({
      userId: userId || null,
      latitude: dto.latitude,
      longitude: dto.longitude,
      address: dto.address,
    });
    return { success: true };
  }

  async getDemandLog() {
    return await this.db
      .select()
      .from(unserviceableRequests)
      .orderBy(desc(unserviceableRequests.createdAt));
  }
}
