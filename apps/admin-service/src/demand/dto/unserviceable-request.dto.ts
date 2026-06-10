import { IsNumber, IsString, IsOptional } from 'class-validator';

export class UnserviceableRequestDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  address?: string;
}
