import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE_ORM, DrizzleDB } from '../drizzle/drizzle.module';
import { addresses, NewAddress, Address } from '@spinzo/db';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class AddressesService {
  constructor(@Inject(DRIZZLE_ORM) private db: DrizzleDB) {}

  async create(userId: string, data: Omit<NewAddress, 'userId'>): Promise<Address> {
    const [newAddress] = await this.db
      .insert(addresses)
      .values({ ...data, userId })
      .returning();
    return newAddress;
  }

  async findAllByUserId(userId: string): Promise<Address[]> {
    return this.db.query.addresses.findMany({
      where: eq(addresses.userId, userId),
    });
  }

  async findOne(userId: string, addressId: string): Promise<Address | undefined> {
    return this.db.query.addresses.findFirst({
      where: and(eq(addresses.id, addressId), eq(addresses.userId, userId)),
    });
  }

  async update(userId: string, addressId: string, data: Partial<NewAddress>): Promise<Address> {
    const [updated] = await this.db
      .update(addresses)
      .set(data)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .returning();
    if (!updated) throw new NotFoundException('Address not found');
    return updated;
  }

  async remove(userId: string, addressId: string): Promise<void> {
    await this.db
      .delete(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));
  }
}
