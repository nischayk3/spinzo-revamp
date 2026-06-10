// ============================================================================
// ORDER EVENTS — used by BullMQ event handlers across services
// ============================================================================

export const ORDER_EVENTS = {
  PLACED: 'order.placed',
  STATUS_CHANGED: 'order.status_changed',
  CANCELLED: 'order.cancelled',
  PICKUP_VERIFIED: 'order.pickup_verified',
  DELIVERY_VERIFIED: 'order.delivery_verified',
} as const;

export const PAYMENT_EVENTS = {
  CREATED: 'payment.created',
  CAPTURED: 'payment.captured',
  FAILED: 'payment.failed',
  REFUNDED: 'payment.refunded',
} as const;

export const NOTIFICATION_EVENTS = {
  SEND_WHATSAPP: 'notification.send_whatsapp',
  SEND_PUSH: 'notification.send_push',
  SEND_SMS: 'notification.send_sms',
} as const;

export const USER_EVENTS = {
  REGISTERED: 'user.registered',
  PROFILE_UPDATED: 'user.profile_updated',
  ADDRESS_ADDED: 'user.address_added',
} as const;

// ============================================================================
// EVENT PAYLOAD TYPES
// ============================================================================

export interface OrderPlacedEvent {
  orderId: string;
  userId: string;
  storeId: string;
  totalAmount: number;
  pickupType: 'instant' | 'scheduled';
}

export interface OrderStatusChangedEvent {
  orderId: string;
  userId: string;
  previousStatus: string;
  newStatus: string;
}

export interface PaymentCapturedEvent {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  method: string;
}

export interface NotificationSendEvent {
  userId: string;
  channel: 'whatsapp' | 'push' | 'sms' | 'email';
  template: string;
  data: Record<string, unknown>;
}
