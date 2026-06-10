import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE_ORM, DrizzleDB } from '../drizzle/drizzle.module';
import { users, NewUser, User } from '@spinzo/db';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE_ORM) private db: DrizzleDB) {}

  async create(userData: NewUser): Promise<User> {
    const [newUser] = await this.db.insert(users).values(userData).returning();
    return newUser;
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({
      where: eq(users.firebaseUid, firebaseUid),
    });
  }

  async findById(id: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async upsertByFirebaseUid(firebaseUid: string, data: Partial<NewUser>): Promise<User> {
    const existing = await this.findByFirebaseUid(firebaseUid);
    if (existing) {
      const [updated] = await this.db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.firebaseUid, firebaseUid))
        .returning();
      return updated;
    }
    const [created] = await this.db
      .insert(users)
      .values({ firebaseUid, phone: data.phone || '', ...data })
      .returning();
    return created;
  }

  async update(id: string, userData: Partial<NewUser>): Promise<User> {
    const [updatedUser] = await this.db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!updatedUser) throw new NotFoundException('User not found');
    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }
}
