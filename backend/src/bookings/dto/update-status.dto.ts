import { IsIn } from 'class-validator';

export const BOOKING_STATUSES = ['pending', 'accepted', 'declined', 'completed'] as const;

export class UpdateStatusDto {
  @IsIn(['accepted', 'declined', 'completed'])
  status!: string;
}