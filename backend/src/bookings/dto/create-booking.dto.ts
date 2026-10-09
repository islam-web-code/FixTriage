import { IsInt, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  serviceId!: number;

  @IsISO8601()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  problemText?: string;
}