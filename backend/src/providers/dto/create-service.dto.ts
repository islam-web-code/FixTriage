import {
  IsString,
  IsOptional,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  IsIn,
} from 'class-validator';

export const SERVICE_CATEGORIES = [
  'electrical',
  'plumbing',
  'car_repair',
  'cleaning',
  'ac_maintenance',
  'phone_repair',
  'cameras',
  'general_handyman',
] as const;

export class CreateServiceDto {
  @IsIn([...SERVICE_CATEGORIES])
  category: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceEstimate?: number;
}