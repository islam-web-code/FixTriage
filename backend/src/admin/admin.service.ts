import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async stats() {
    const [users, providers, services, bookings, reviews] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.providerProfile.count(),
      this.prisma.service.count(),
      this.prisma.booking.count(),
      this.prisma.review.count(),
    ]);
    return { users, providers, services, bookings, reviews };
  }

  listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { bookings: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listServices() {
    return this.prisma.service.findMany({
      include: {
        provider: { include: { user: { select: { name: true, email: true } } } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listReviews() {
    return this.prisma.review.findMany({
      include: {
        user: { select: { name: true, email: true } },
        provider: { include: { user: { select: { name: true } } } },
        booking: { select: { service: { select: { title: true, category: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteUser(adminId: number, userId: number) {
    if (adminId === userId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { providerProfile: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === 'admin') {
      throw new ForbiddenException('Admin accounts cannot be deleted here');
    }

    const profileId = user.providerProfile?.id;

    // Every booking this user is part of — as customer or as provider
    const bookings = await this.prisma.booking.findMany({
      where: profileId
        ? { OR: [{ userId }, { providerId: profileId }] }
        : { userId },
      select: { id: true },
    });
    const bookingIds = bookings.map((b) => b.id);

    // Children first, parent last — all or nothing
    await this.prisma.$transaction([
      this.prisma.message.deleteMany({
        where: { OR: [{ bookingId: { in: bookingIds } }, { senderId: userId }] },
      }),
      this.prisma.review.deleteMany({
        where: {
          OR: [
            { bookingId: { in: bookingIds } },
            { userId },
            ...(profileId ? [{ providerId: profileId }] : []),
          ],
        },
      }),
      this.prisma.booking.deleteMany({ where: { id: { in: bookingIds } } }),
      ...(profileId
        ? [
            // availability rows are removed automatically (onDelete: Cascade)
            this.prisma.service.deleteMany({ where: { providerId: profileId } }),
            this.prisma.providerProfile.delete({ where: { id: profileId } }),
          ]
        : []),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);

    return { deleted: true };
  }

  async deleteService(serviceId: number) {
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const bookings = await this.prisma.booking.findMany({
      where: { serviceId },
      select: { id: true },
    });
    const bookingIds = bookings.map((b) => b.id);

    await this.prisma.$transaction([
      this.prisma.message.deleteMany({ where: { bookingId: { in: bookingIds } } }),
      this.prisma.review.deleteMany({ where: { bookingId: { in: bookingIds } } }),
      this.prisma.booking.deleteMany({ where: { id: { in: bookingIds } } }),
      this.prisma.service.delete({ where: { id: serviceId } }),
    ]);

    return { deleted: true };
  }

  async deleteReview(reviewId: number) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    await this.prisma.review.delete({ where: { id: reviewId } });
    return { deleted: true };
  }
}