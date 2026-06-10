import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@spinzo/db';

export const DRIZZLE_ORM = 'DRIZZLE_ORM';
export type DrizzleDB = NodePgDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_ORM,
      useFactory: async () => {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        });
        console.log('[DrizzleModule] Connected to PostgreSQL');
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DRIZZLE_ORM],
})
export class DrizzleModule {}
