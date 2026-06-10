import { z } from 'zod';

// ============================================================================
// ORDER ENUMS
// ============================================================================

export const OrderStatusEnum = z.enum([
  'confirmed',
  'pickup_completed',
  'processing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
]);

export const PickupTypeEnum = z.enum(['instant', 'scheduled']);

export const PaymentMethodEnum = z.enum([
  'razorpay',
  'subscription_credit',
  'cod',
]);

// ============================================================================
// ORDER SCHEMAS
// ============================================================================

export const CreateOrderSchema = z.object({
  storeId: z.string().uuid(),
  items: z
    .array(
      z.object({
        serviceItemId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  pickupType: PickupTypeEnum,
  pickupDate: z.string().optional(),
  pickupTime: z.string().optional(),
  addressId: z.string().uuid(),
  paymentMethod: PaymentMethodEnum,
  subscriptionId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const UpdateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: OrderStatusEnum,
  reason: z.string().max(500).optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type OrderStatus = z.infer<typeof OrderStatusEnum>;
export type PickupType = z.infer<typeof PickupTypeEnum>;
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;
