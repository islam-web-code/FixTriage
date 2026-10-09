import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.userId, dto);
  }

  @Get('mine')
  findMyBookings(@Request() req) {
    return this.bookingsService.findMyBookings(req.user.userId);
  }

  @Get('received')
  findProviderBookings(@Request() req) {
    return this.bookingsService.findProviderBookings(req.user.userId);
  }

  @Get('messages/recent')
  getRecentMessages(@Request() req, @Query('since') since?: string) {
    return this.bookingsService.getRecentMessages(req.user.userId, since);
  }

  @Patch(':id/status')
  updateStatus(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.bookingsService.updateStatus(req.user.userId, id, dto.status);
  }

  @Post(':id/review')
  createReview(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.bookingsService.createReview(req.user.userId, id, dto);
  }

  @Get(':id/messages')
  getMessages(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.getMessages(req.user.userId, id);
  }

  @Post(':id/messages')
  sendMessage(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMessageDto,
  ) {
    return this.bookingsService.sendMessage(req.user.userId, id, dto);
  }
}