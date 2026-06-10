import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  doublePrecision,
  text,
  boolean,
  decimal,
  date,
  jsonb,
  serial,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel, relations } from 'drizzle-orm';

// ============================================================================
// USERS & AUTH
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: varchar('firebase_uid', { length: 128 }).unique().notNull(),
  phone: varchar('phone', { length: 15 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  gender: varchar('gender', { length: 20 }),
  referralCode: varchar('referral_code', { length: 50 }),
  role: varchar('role', { length: 20 }).default('customer').notNull(),
  credits: integer('credits').default(0),
  subscriptionStatus: varchar('subscription_status', { length: 20 }).default('inactive'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const addresses = pgTable(
  'addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    label: varchar('label', { length: 50 }).notNull(),
    addressLine: text('address_line').notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    pincode: varchar('pincode', { length: 10 }),
    city: varchar('city', { length: 100 }),
    isPrimary: boolean('is_primary').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_addresses_user').on(table.userId),
  }),
);

// ============================================================================
// STORES & ZONES
// ============================================================================

export const stores = pgTable('stores', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  address: text('address'),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  radiusMeters: integer('radius_meters').default(3000).notNull(),
  isActive: boolean('is_active').default(true),
  operatingHours: jsonb('operating_hours'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const serviceZones = pgTable('service_zones', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id')
    .references(() => stores.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  centerLat: doublePrecision('center_lat').notNull(),
  centerLng: doublePrecision('center_lng').notNull(),
  radiusMeters: integer('radius_meters').notNull(),
  pincodes: text('pincodes').array(),
  isActive: boolean('is_active').default(true),
});

// ============================================================================
// CATALOG & SERVICES
// ============================================================================

export const serviceCategories = pgTable('service_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id').references(() => stores.id),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
});

export const serviceItems = pgTable('service_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => serviceCategories.id),
  name: varchar('name', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 20 }).default('piece'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
});

// ============================================================================
// ORDERS
// ============================================================================

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    storeId: uuid('store_id')
      .references(() => stores.id)
      .notNull(),
    status: varchar('status', { length: 30 }).default('confirmed').notNull(),
    pickupType: varchar('pickup_type', { length: 20 }).notNull(),
    pickupDate: date('pickup_date'),
    pickupTime: varchar('pickup_time', { length: 30 }),
    deliveryDate: date('delivery_date'),
    deliveryTime: varchar('delivery_time', { length: 30 }),
    pickupOtp: varchar('pickup_otp', { length: 6 }),
    pickupVerified: boolean('pickup_verified').default(false),
    pickedUpAt: timestamp('picked_up_at', { withTimezone: true }),
    deliveryOtp: varchar('delivery_otp', { length: 6 }),
    deliveryVerified: boolean('delivery_verified').default(false),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    tokenNumber: varchar('token_number', { length: 20 }),
    address: jsonb('address').notNull(),
    billDetails: jsonb('bill_details'),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).default('0').notNull(),
    subscriptionId: uuid('subscription_id'),
    paymentMethod: varchar('payment_method', { length: 30 }),
    notes: text('notes'),
    cancellationReason: text('cancellation_reason'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_orders_user').on(table.userId),
    storeIdx: index('idx_orders_store').on(table.storeId),
    statusIdx: index('idx_orders_status').on(table.status),
    createdIdx: index('idx_orders_created').on(table.createdAt),
    pickupDateIdx: index('idx_orders_pickup_date').on(table.pickupDate),
  }),
);

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  serviceItemId: uuid('service_item_id').references(() => serviceItems.id),
  name: varchar('name', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  photos: text('photos').array(),
});

// ============================================================================
// SLOTS
// ============================================================================

export const dailySlots = pgTable(
  'daily_slots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    storeId: uuid('store_id')
      .references(() => stores.id)
      .notNull(),
    slotDate: date('slot_date').notNull(),
    slotTime: varchar('slot_time', { length: 30 }).notNull(),
    bookedCount: integer('booked_count').default(0),
    maxCapacity: integer('max_capacity').default(5),
  },
  (table) => ({
    slotDateIdx: index('idx_slots_date').on(table.storeId, table.slotDate),
    uniqueSlot: uniqueIndex('uq_store_slot').on(table.storeId, table.slotDate, table.slotTime),
  }),
);

// ============================================================================
// PAYMENTS
// ============================================================================

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  orderId: uuid('order_id').references(() => orders.id),
  razorpayOrderId: varchar('razorpay_order_id', { length: 100 }),
  razorpayPaymentId: varchar('razorpay_payment_id', { length: 100 }),
  razorpaySignature: varchar('razorpay_signature', { length: 255 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('INR'),
  status: varchar('status', { length: 20 }).notNull(),
  method: varchar('method', { length: 30 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// SUBSCRIPTIONS & CREDITS
// ============================================================================

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  planType: varchar('plan_type', { length: 20 }).notNull(),
  totalCredits: integer('total_credits').notNull(),
  creditsUsed: integer('credits_used').default(0),
  creditsRemaining: integer('credits_remaining').notNull(),
  currentCreditIndex: integer('current_credit_index').default(0),
  pricePerCredit: decimal('price_per_credit', { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  kgPerCredit: decimal('kg_per_credit', { precision: 5, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('active'),
  paymentId: uuid('payment_id').references(() => payments.id),
  purchasedAt: timestamp('purchased_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const creditUsage = pgTable('credit_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  subscriptionId: uuid('subscription_id')
    .references(() => subscriptions.id)
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  creditIndex: integer('credit_index').notNull(),
  orderId: uuid('order_id').references(() => orders.id),
  usedAt: timestamp('used_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notificationLog = pgTable('notification_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  channel: varchar('channel', { length: 20 }).notNull(),
  template: varchar('template', { length: 100 }),
  status: varchar('status', { length: 20 }).notNull(),
  metadata: jsonb('metadata'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// UNSERVICEABLE REQUESTS (demand tracking)
// ============================================================================

export const unserviceableRequests = pgTable('unserviceable_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  address: text('address'),
  pincode: varchar('pincode', { length: 10 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// CARTS
// ============================================================================

export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  items: jsonb('items').default('[]').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Address = InferSelectModel<typeof addresses>;
export type NewAddress = InferInsertModel<typeof addresses>;

export type Store = InferSelectModel<typeof stores>;
export type NewStore = InferInsertModel<typeof stores>;

export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;

export type OrderItem = InferSelectModel<typeof orderItems>;
export type NewOrderItem = InferInsertModel<typeof orderItems>;

export type Payment = InferSelectModel<typeof payments>;
export type NewPayment = InferInsertModel<typeof payments>;

export type Subscription = InferSelectModel<typeof subscriptions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;

export type Cart = InferSelectModel<typeof carts>;
export type NewCart = InferInsertModel<typeof carts>;

// ============================================================================
// RELATIONS (required for Drizzle relational query API: db.query.*)
// ============================================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  addresses: many(addresses),
  orders: many(orders),
  subscriptions: many(subscriptions),
  creditUsages: many(creditUsage),
  cart: one(carts, { fields: [users.id], references: [carts.userId] }),
}));

export const cartsRelations = relations(carts, ({ one }) => ({
  user: one(users, { fields: [carts.userId], references: [users.id] }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));

export const storesRelations = relations(stores, ({ many }) => ({
  serviceZones: many(serviceZones),
  serviceCategories: many(serviceCategories),
  orders: many(orders),
  dailySlots: many(dailySlots),
}));

export const serviceZonesRelations = relations(serviceZones, ({ one }) => ({
  store: one(stores, { fields: [serviceZones.storeId], references: [stores.id] }),
}));

export const serviceCategoriesRelations = relations(serviceCategories, ({ one, many }) => ({
  store: one(stores, { fields: [serviceCategories.storeId], references: [stores.id] }),
  items: many(serviceItems),
}));

export const serviceItemsRelations = relations(serviceItems, ({ one }) => ({
  category: one(serviceCategories, { fields: [serviceItems.categoryId], references: [serviceCategories.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  store: one(stores, { fields: [orders.storeId], references: [stores.id] }),
  items: many(orderItems),
  payment: one(payments, { fields: [orders.id], references: [payments.orderId] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  serviceItem: one(serviceItems, { fields: [orderItems.serviceItemId], references: [serviceItems.id] }),
}));

export const dailySlotsRelations = relations(dailySlots, ({ one }) => ({
  store: one(stores, { fields: [dailySlots.storeId], references: [stores.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  payment: one(payments, { fields: [subscriptions.paymentId], references: [payments.id] }),
  creditUsages: many(creditUsage),
}));

export const creditUsageRelations = relations(creditUsage, ({ one }) => ({
  subscription: one(subscriptions, { fields: [creditUsage.subscriptionId], references: [subscriptions.id] }),
  user: one(users, { fields: [creditUsage.userId], references: [users.id] }),
  order: one(orders, { fields: [creditUsage.orderId], references: [orders.id] }),
}));
