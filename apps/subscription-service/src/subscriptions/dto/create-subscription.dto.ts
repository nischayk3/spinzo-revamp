import { IsIn, IsNumber } from 'class-validator';

export class CreateSubscriptionDto {
  @IsIn(['single', 'couple'])
  planType: string;

  @IsNumber()
  totalCredits: number;
}
