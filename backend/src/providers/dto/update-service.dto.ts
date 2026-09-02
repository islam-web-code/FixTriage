import { IsIn, IsInt } from 'class-validator';

export class UpdateServiceDto {
  @IsInt()
  @IsIn([15, 30, 45, 60, 90, 120])
  slotMinutes!: number;
}