/**
 * Spinzo Catalog + Default Store Seed
 *
 * Run once to populate:
 *   - 1 default store (expandable to multiple later)
 *   - 1 service zone for Bangalore
 *   - 5 service categories with pricing matching the live production app
 *
 * Usage:
 *   DATABASE_URL="..." ts-node tools/seed-catalog.ts
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../packages/db/src/schema';
import { eq } from 'drizzle-orm';

const {
  stores,
  serviceZones,
  serviceCategories,
  serviceItems,
} = schema;

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(pool, { schema });

  console.log('🌱 Starting Spinzo catalog seed...');

  // ─────────────────────────────────────────────
  // 1. Default Store (Bangalore HQ)
  // ─────────────────────────────────────────────
  const STORE_CODE = 'BLR_MAIN';

  const existing = await db
    .select()
    .from(stores)
    .where(eq(stores.code, STORE_CODE));

  let storeId: string;

  if (existing.length > 0) {
    storeId = existing[0].id;
    console.log(`✅ Store already exists: ${storeId}`);
  } else {
    const [store] = await db
      .insert(stores)
      .values({
        name: 'SpinZo Bangalore Main',
        code: STORE_CODE,
        address: 'Bangalore, Karnataka, India',
        latitude: 12.9716,
        longitude: 77.5946,
        radiusMeters: 10000,
        isActive: true,
        operatingHours: {
          monday: { open: '07:00', close: '20:00' },
          tuesday: { open: '07:00', close: '20:00' },
          wednesday: { open: '07:00', close: '20:00' },
          thursday: { open: '07:00', close: '20:00' },
          friday: { open: '07:00', close: '20:00' },
          saturday: { open: '07:00', close: '20:00' },
          sunday: { open: '09:00', close: '18:00' },
        },
      })
      .returning();
    storeId = store.id;
    console.log(`✅ Created store: ${storeId} (${store.name})`);

    // Service zone
    await db.insert(serviceZones).values({
      storeId,
      name: 'Bangalore Central Zone',
      centerLat: 12.9716,
      centerLng: 77.5946,
      radiusMeters: 10000,
      pincodes: ['560001', '560002', '560003', '560004', '560008', '560011', '560018', '560027', '560038', '560047', '560051', '560095'],
      isActive: true,
    });
    console.log('✅ Created service zone');
  }

  // ─────────────────────────────────────────────
  // 2. Service Categories + Items
  //    Mapped 1:1 from Livfresh production app
  // ─────────────────────────────────────────────
  const catalogData = [
    {
      name: 'Wash & Fold',
      slug: 'wash_fold',
      description: 'Professional washing and folding. Billed by weight.',
      imageUrl: null,
      sortOrder: 1,
      items: [
        { name: 'Wash & Fold (per kg)', price: '69.00', unit: 'kg', sortOrder: 1 },
      ],
    },
    {
      name: 'Wash & Iron',
      slug: 'wash_iron',
      description: 'Washing + steam ironing. Billed by weight.',
      imageUrl: null,
      sortOrder: 2,
      items: [
        { name: 'Wash & Iron (per kg)', price: '99.00', unit: 'kg', sortOrder: 1 },
      ],
    },
    {
      name: 'Steam Ironing',
      slug: 'ironing',
      description: 'Steam ironing only. Billed per piece.',
      imageUrl: null,
      sortOrder: 3,
      items: [
        { name: 'Steam Iron (per piece)', price: '10.00', unit: 'piece', sortOrder: 1 },
      ],
    },
    {
      name: 'Blanket Wash',
      slug: 'blanket_wash',
      description: 'Deep cleaning for blankets and duvets.',
      imageUrl: null,
      sortOrder: 4,
      items: [
        { name: 'Single Blanket', price: '199.00', unit: 'piece', sortOrder: 1 },
        { name: 'Double Blanket', price: '299.00', unit: 'piece', sortOrder: 2 },
      ],
    },
    {
      name: 'Smart Care Subscription',
      slug: 'subscription',
      description: 'Pre-paid wash credits. Single or couple plans.',
      imageUrl: null,
      sortOrder: 5,
      items: [
        { name: 'Single Plan (per credit)', price: '399.00', unit: 'credit', sortOrder: 1 },
        { name: 'Couple Plan (per credit)', price: '798.00', unit: 'credit', sortOrder: 2 },
      ],
    },
  ];

  for (const cat of catalogData) {
    // Check if category already exists
    const existingCat = await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.slug, cat.slug));

    let catId: string;

    if (existingCat.length > 0) {
      catId = existingCat[0].id;
      console.log(`⏭️  Category already exists: ${cat.slug}`);
    } else {
      const [newCat] = await db
        .insert(serviceCategories)
        .values({
          storeId, // linked to the store — can be set to null for global catalog
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          imageUrl: cat.imageUrl,
          isActive: true,
          sortOrder: cat.sortOrder,
        })
        .returning();
      catId = newCat.id;
      console.log(`✅ Created category: ${cat.name} (${catId})`);
    }

    // Seed items
    for (const item of cat.items) {
      const existingItem = await db
        .select()
        .from(serviceItems)
        .where(eq(serviceItems.categoryId, catId));

      const alreadyExists = existingItem.some((i) => i.name === item.name);
      if (alreadyExists) {
        console.log(`   ⏭️  Item already exists: ${item.name}`);
        continue;
      }

      await db.insert(serviceItems).values({
        categoryId: catId,
        name: item.name,
        price: item.price,
        unit: item.unit,
        isActive: true,
        sortOrder: item.sortOrder,
      });
      console.log(`   ✅ Created item: ${item.name} @ ₹${item.price}/${item.unit}`);
    }
  }

  console.log('\n🎉 Seed complete!');
  console.log(`\n   Default Store ID: ${storeId}`);
  console.log('   Set this as DEFAULT_STORE_ID in your .env files.\n');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
