import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@spinzo/db';
import { eq } from 'drizzle-orm';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const db = drizzle(pool, { schema });

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    
    const request = context.switchToHttp().getRequest();
    const user = (request as any).user; // Set by JwtAuthGuard which must run BEFORE this

    if (!user || !user.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Lookup user in DB to get their role.
    // In a highly optimized setup, this would be in the JWT payload.
    // Doing it in DB lookup for Gateway ensures immediate revocation if role changes.
    const [dbUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, user.userId));

    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

    const userRole = dbUser.role || 'customer';

    // We inject the role into the request so proxy controllers can forward it
    (request as any).userRole = userRole;

    if (!requiredRoles || requiredRoles.length === 0) {
      // If no specific roles required, just attach the role and let it pass
      return true;
    }

    // Role hierarchy logic
    // super_admin can do everything
    if (userRole === 'super_admin') {
      return true;
    }

    const hasRole = requiredRoles.includes(userRole);
    if (!hasRole) {
      throw new ForbiddenException(`Requires one of roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
