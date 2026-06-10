import { IsArray, ValidateNested, IsString, IsNumber, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemDto {
  @IsString()
  serviceId: string; // e.g. 'wash_fold', 'ironing'

  @IsString()
  serviceName: string;

  @IsIn(['wash_fold', 'wash_iron', 'ironing', 'blanket_wash', 'shoe_clean', 'dry_clean', 'premium_laundry'])
  serviceType: string;

  @IsNumber()
  basePrice: number;

  @IsNumber()
  totalPrice: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  clothesCount?: number;

  @IsOptional()
  @IsNumber()
  ironingCount?: number;

  @IsOptional()
  @IsNumber()
  blanketQuantity?: number;

  @IsOptional()
  @IsString()
  blanketType?: string;

  @IsOptional()
  @IsNumber()
  shoeQuantity?: number;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsArray()
  photoUrls?: string[];

  // Credit-based fields (for subscription orders)
  @IsOptional()
  isCreditItem?: boolean;

  @IsOptional()
  @IsString()
  creditSubscriptionId?: string;

  @IsOptional()
  @IsNumber()
  creditIndex?: number;
}

export class UpsertCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
}
