/**
 * Spinzo: Firestore Backup → PostgreSQL Migration
 *
 * Reads from the backup JSON files (not live Firestore) and inserts into Neon PostgreSQL.
 * Idempotent — uses ON CONFLICT DO NOTHING so it can be re-run safely.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... npx ts-node src/migrate-from-backup.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@spinzo/db';
import { users, addresses, unserviceableRequests } from '@spinzo/db';

const BACKUP_DIR = path.resolve(__dirname, '../../../backups/2026-05-25_19-54-35');

// --- PostgreSQL Connection ---
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const db = drizzle(pool, { schema });

// --- Helpers ---
function parseTimestamp(val: any): Date {
  if (!val) return new Date();
  if (val._seconds) return new Date(val._seconds * 1000);
  if (typeof val === 'string') return new Date(val);
  return new Date();
}

// --- Migrate Users ---
async function migrateUsers() {
  console.log('\n📦 Loading firestore.json...');
  const raw = fs.readFileSync(path.join(BACKUP_DIR, 'firestore.json'), 'utf-8');
  const data = JSON.parse(raw);

  const firestoreUsers = data.users || {};
  const totalUsers = Object.keys(firestoreUsers).length;
  console.log(`👥 Found ${totalUsers} users in backup`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;
  let addressCount = 0;

  for (const [docId, userData] of Object.entries(firestoreUsers) as [string, any][]) {
    const phone = userData.phone || '';

    // Skip users without a phone — can't be valid
    if (!phone) {
      skipped++;
      continue;
    }

    try {
      // The Firestore doc ID IS the Firebase UID
      const firebaseUid = docId;

      const [newUser] = await db
        .insert(users)
        .values({
          firebaseUid,
          phone,
          name: userData.name || null,
          email: userData.email || null,
          gender: userData.gender || null,
          referralCode: userData.referralCode || null,
          role: 'customer',
          credits: userData.credits || 0,
          subscriptionStatus: userData.subscriptionStatus || 'inactive',
          createdAt: parseTimestamp(userData.createdAt),
          updatedAt: parseTimestamp(userData.updatedAt),
        })
        .onConflictDoNothing({ target: users.firebaseUid })
        .returning();

      if (newUser) {
        migrated++;

        // Migrate embedded savedAddresses
        const savedAddresses = userData.savedAddresses || [];
        for (const addr of savedAddresses) {
          try {
            await db
              .insert(addresses)
              .values({
                userId: newUser.id,
                label: addr.label || 'Other',
                addressLine: addr.address || addr.addressLine || '',
                latitude: addr.latitude || 0,
                longitude: addr.longitude || 0,
                pincode: addr.pincode || null,
                city: addr.city || null,
                isPrimary: addr.isPrimary || false,
                createdAt: parseTimestamp(addr.createdAt),
              })
              .onConflictDoNothing();
            addressCount++;
          } catch (addrErr: any) {
            console.error(`  ⚠️  Address error for user ${firebaseUid}:`, addrErr.message);
          }
        }
      } else {
        skipped++; // Already existed (conflict)
      }

      if (migrated % 100 === 0 && migrated > 0) {
        console.log(`  ... migrated ${migrated}/${totalUsers} users`);
      }
    } catch (err: any) {
      errors++;
      console.error(`❌ Error migrating user ${docId}:`, err.message);
    }
  }

  console.log(`\n✅ Users migration complete:`);
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Skipped (no phone or already exists): ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Addresses: ${addressCount}`);
}

// --- Migrate Unserviceable Requests ---
async function migrateUnserviceableRequests() {
  console.log('\n📦 Migrating unserviceable requests...');
  const raw = fs.readFileSync(path.join(BACKUP_DIR, 'firestore.json'), 'utf-8');
  const data = JSON.parse(raw);

  const requests = data.unserviceable_requests || {};
  const total = Object.keys(requests).length;
  console.log(`📍 Found ${total} unserviceable requests`);

  let migrated = 0;
  for (const [docId, req] of Object.entries(requests) as [string, any][]) {
    try {
      const location = req.location || {};
      await db
        .insert(unserviceableRequests)
        .values({
          latitude: location._latitude || location.latitude || null,
          longitude: location._longitude || location.longitude || null,
          address: req.address || null,
          createdAt: parseTimestamp(req.timestamp),
        })
        .onConflictDoNothing();
      migrated++;
    } catch (err: any) {
      console.error(`⚠️  Error migrating request ${docId}:`, err.message);
    }
  }

  console.log(`✅ Unserviceable requests: ${migrated}/${total} migrated`);
}

// --- Main ---
async function main() {
  console.log('🚀 Spinzo Firestore → PostgreSQL Migration');
  console.log(`📂 Reading backup from: ${BACKUP_DIR}`);

  // Verify backup exists
  if (!fs.existsSync(path.join(BACKUP_DIR, 'firestore.json'))) {
    console.error(`❌ Backup file not found at ${BACKUP_DIR}/firestore.json`);
    process.exit(1);
  }

  const manifest = JSON.parse(
    fs.readFileSync(path.join(BACKUP_DIR, 'manifest.json'), 'utf-8'),
  );
  console.log(`📋 Backup from: ${manifest.timestamp}`);
  console.log(`   Firestore docs: ${manifest.firestore.totalDocs}`);
  console.log(`   Auth users: ${manifest.auth.totalUsers}`);

  await migrateUsers();
  await migrateUnserviceableRequests();

  console.log('\n🎉 All migrations complete!');
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('💥 Migration failed:', err);
  process.exit(1);
});
