import { IsString, IsNumber, IsIn } from 'class-validator';

export class AddCreditsDto {
  @IsString()
  phone: string;

  @IsIn(['single', 'couple'])
  planType: string;

  @IsNumber()
  credits: number;
}
