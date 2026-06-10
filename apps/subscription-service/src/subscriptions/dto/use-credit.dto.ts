import { IsOptional, IsUUID } from 'class-validator';

export class UseCreditDto {
  @IsOptional()
  @IsUUID()
  orderId?: string;
}
