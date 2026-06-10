import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

// Order lifecycle status transitions (mirrored from live app)
export const ORDER_STATUSES = [
  'confirmed',       // Order placed
  'pickup_completed', // Delivery partner picked up clothes
  'processing',      // At laundry — being washed
  'ready',           // Done, ready for delivery
  'out_for_delivery', // En-route to customer
  'delivered',       // Delivered to customer
  'cancelled',       // Cancelled
] as const;

export class UpdateOrderStatusDto {
  @IsIn([...ORDER_STATUSES])
  status: string;

  // For pickup OTP verification (pickup_completed transition)
  @IsOptional()
  @IsBoolean()
  verifyPickupOtp?: boolean;

  @IsOptional()
  @IsString()
  pickupOtp?: string;

  // For delivery OTP verification (delivered transition)
  @IsOptional()
  @IsBoolean()
  verifyDeliveryOtp?: boolean;

  @IsOptional()
  @IsString()
  deliveryOtp?: string;

  // Token number assigned when order enters processing
  @IsOptional()
  @IsString()
  tokenNumber?: string;

  // For cancellations
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
