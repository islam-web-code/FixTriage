import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { SlotsService } from './slots.service';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, SlotsService],
  exports: [SlotsService],
})
export class BookingsModule {}