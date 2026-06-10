import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  IsUUID,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsOptional()
  @IsUUID()
  serviceItemId?: string;

  @IsString()
  name: string;

  @IsString()
  price: string; // Decimal as string

  @IsNumber()
  quantity: number;

  @IsString()
  subtotal: string; // Decimal as string

  @IsOptional()
  @IsArray()
  photos?: string[];
}

export class AddressDto {
  @IsString()
  label: string;

  @IsString()
  addressLine: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class CreateOrderDto {
  @IsUUID()
  storeId: string;

  @IsIn(['scheduled', 'express'])
  pickupType: string;

  @IsString()
  pickupDate: string; // YYYY-MM-DD

  @IsString()
  pickupTime: string; // e.g. "10:00-11:00"

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNumber()
  totalAmount: number;

  @IsIn(['cod', 'upi', 'subscription', 'razorpay'])
  paymentMethod: string;

  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  billDetails?: Record<string, any>;
}
