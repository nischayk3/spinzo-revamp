import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as firebaseAdmin from 'firebase-admin';
import { DRIZZLE_ORM, DrizzleDB } from '../drizzle/drizzle.module';
import { users, User } from '@spinzo/db';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(DRIZZLE_ORM) private db: DrizzleDB,
  ) {}

  /**
   * Validates a Firebase ID token and upserts the user in PostgreSQL.
   * Returns the DB user record (not a mock).
   */
  async validateFirebaseToken(firebaseIdToken: string): Promise<User> {
    // --- Development Bypass ---
    if (process.env.DEV_BYPASS_FIREBASE === 'true') {
      console.warn('!!! Firebase ID Token verification is bypassed in development mode. !!!');
      return this.upsertUser('mock-firebase-uid', '+919999999999', 'Mock User');
    }

    try {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(firebaseIdToken);
      return this.upsertUser(
        decodedToken.uid,
        decodedToken.phone_number || '',
        decodedToken.name || '',
        decodedToken.email || '',
      );
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase ID token');
    }
  }

  /**
   * Upsert user in PostgreSQL — create if not exists, update if exists.
   * This is the bridge between Firebase Auth and our relational DB.
   */
  private async upsertUser(
    firebaseUid: string,
    phone: string,
    name?: string,
    email?: string,
  ): Promise<User> {
    const existing = await this.db.query.users.findFirst({
      where: eq(users.firebaseUid, firebaseUid),
    });

    if (existing) {
      // Update last-seen fields
      const [updated] = await this.db
        .update(users)
        .set({ updatedAt: new Date(), name: name || existing.name, email: email || existing.email })
        .where(eq(users.firebaseUid, firebaseUid))
        .returning();
      return updated;
    }

    // First login — create user in DB
    const [newUser] = await this.db
      .insert(users)
      .values({
        firebaseUid,
        phone,
        name: name || null,
        email: email || null,
        role: 'customer',
      })
      .returning();
    console.log(`[AuthService] Created new user: ${newUser.id} (firebase: ${firebaseUid})`);
    return newUser;
  }

  /**
   * Issues JWT access + refresh tokens for a validated user.
   * The JWT `sub` is now the PostgreSQL UUID, not the Firebase UID.
   */
  async login(user: User) {
    const payload = { sub: user.id, role: user.role, phone: user.phone, firebaseUid: user.firebaseUid };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d',
      }),
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    };
  }
}