import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SlotsService } from './slots.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private slotsService: SlotsService,
  ) {}

    /** Messages from the other party across active bookings, for notification polling. */
  async getRecentMessages(userId: number, since?: string) {
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 60000);

    return this.prisma.message.findMany({
      where: {
        senderId: { not: userId },
        createdAt: { gt: sinceDate },
        booking: {
          status: 'accepted',
          OR: [{ userId }, { provider: { userId } }],
        },
      },
      include: {
        sender: { select: { name: true } },
        booking: { select: { id: true, service: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }
    /** Both participants can read the thread at any status except pending. */
  async getMessages(userId: number, bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { provider: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isCustomer = booking.userId === userId;
    const isProvider = booking.provider.userId === userId;
    if (!isCustomer && !isProvider) {
      throw new ForbiddenException('This conversation is not yours');
    }
    if (booking.status === 'pending' || booking.status === 'declined') {
      throw new BadRequestException(
        'Messaging opens once the provider accepts the booking',
      );
    }

    const messages = await this.prisma.message.findMany({
      where: { bookingId },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return {
      messages,
      canSend: booking.status === 'accepted',
      status: booking.status,
    };
  }

  /** Sending is only allowed while the job is accepted (not yet completed). */
  async sendMessage(userId: number, bookingId: number, dto: CreateMessageDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { provider: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isCustomer = booking.userId === userId;
    const isProvider = booking.provider.userId === userId;
    if (!isCustomer && !isProvider) {
      throw new ForbiddenException('This conversation is not yours');
    }
    if (booking.status !== 'accepted') {
      throw new BadRequestException(
        booking.status === 'completed'
          ? 'This job is completed — the conversation is now read-only'
          : 'Messaging opens once the provider accepts the booking',
      );
    }

    return this.prisma.message.create({
      data: { bookingId, senderId: userId, content: dto.content },
      include: { sender: { select: { id: true, name: true } } },
    });
  }

    async createReview(userId: number, bookingId: number, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.userId !== userId) {
      throw new ForbiddenException('You can only review your own bookings');
    }
    if (booking.status !== 'completed') {
      throw new BadRequestException(
        'You can only review a booking once it is completed',
      );
    }
    if (booking.review) {
      throw new ConflictException('You already reviewed this booking');
    }

    return this.prisma.review.create({
      data: {
        bookingId: booking.id,
        userId,
        providerId: booking.providerId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }
  async create(userId: number, dto: CreateBookingDto) {
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      include: { provider: true, availability: true },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    if (service.provider.userId === userId) {
      throw new BadRequestException('You cannot book your own service');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Invalid date');
    }
    if (scheduledAt.getTime() < Date.now()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    const dateStr = [
      scheduledAt.getFullYear(),
      String(scheduledAt.getMonth() + 1).padStart(2, '0'),
      String(scheduledAt.getDate()).padStart(2, '0'),
    ].join('-');

    const { slots } = await this.slotsService.getSlots(service.id, dateStr);
    const isValidSlot = slots.some(
      (s) => new Date(s).getTime() === scheduledAt.getTime(),
    );
    if (!isValidSlot) {
      throw new ConflictException(
        'That time slot is not available — please pick another',
      );
    }

    return this.prisma.booking.create({
      data: {
        userId,
        providerId: service.providerId,
        serviceId: service.id,
        scheduledAt,
        problemText: dto.problemText,
      },
      include: {
        service: true,
        provider: { include: { user: { select: { name: true } } } },
      },
    });
  }

  async findMyBookings(userId: number) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        service: true,
        provider: { include: { user: { select: { name: true } } } },
        review: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findProviderBookings(userId: number) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('No provider profile found');
    }

    return this.prisma.booking.findMany({
      where: { providerId: profile.id },
      include: {
        service: true,
        user: { select: { name: true } },
        review: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async updateStatus(userId: number, bookingId: number, status: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { provider: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.provider.userId !== userId) {
      throw new ForbiddenException('Only the provider can update this booking');
    }

    const allowed: Record<string, string[]> = {
      pending: ['accepted', 'declined'],
      accepted: ['completed'],
      declined: [],
      completed: [],
    };

    if (!allowed[booking.status].includes(status)) {
      throw new BadRequestException(
        `Cannot change a ${booking.status} booking to ${status}`,
      );
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }
}