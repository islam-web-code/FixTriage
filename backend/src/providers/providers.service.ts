import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { GeocodingService } from './geocoding.service';
import { SetAvailabilityDto } from './dto/set-availability.dto';

@Injectable()
export class ProvidersService {
    constructor(
    private prisma: PrismaService,
    private geocoding: GeocodingService,
  ) {}

    async createProfile(userId: number, dto: CreateProfileDto) {
    const existing = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('Provider profile already exists');
    }

    const coords = dto.address ? await this.geocoding.geocode(dto.address) : null;

    const profile = await this.prisma.providerProfile.create({
      data: {
        userId,
        ...dto,
        ...(coords ?? {}),
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'provider' },
    });

    return profile;
  }

  async getMyProfile(userId: number) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: { services: true },
    });
    if (!profile) {
      throw new NotFoundException('No provider profile found');
    }
    return profile;
  }

    async updateProfile(userId: number, dto: CreateProfileDto) {
    const current = await this.getMyProfile(userId);

    const addressChanged = dto.address && dto.address !== current.address;
    const coords = addressChanged ? await this.geocoding.geocode(dto.address!) : null;

    return this.prisma.providerProfile.update({
      where: { userId },
      data: {
        ...dto,
        ...(coords ?? {}),
      },
    });
  }

  async addService(userId: number, dto: CreateServiceDto) {
    const profile = await this.getMyProfile(userId);
    return this.prisma.service.create({
      data: { providerId: profile.id, ...dto },
    });
  }

  async deleteService(userId: number, serviceId: number) {
    const profile = await this.getMyProfile(userId);
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    if (service.providerId !== profile.id) {
      throw new ForbiddenException('This service belongs to another provider');
    }
    return this.prisma.service.delete({ where: { id: serviceId } });
  }

    async setAvailability(userId: number, serviceId: number, dto: SetAvailabilityDto) {
    const profile = await this.getMyProfile(userId);
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    if (service.providerId !== profile.id) {
      throw new ForbiddenException('This service belongs to another provider');
    }

    for (const slot of dto.slots) {
      if (slot.endHour <= slot.startHour) {
        throw new BadRequestException(
          `End hour must be after start hour (day ${slot.dayOfWeek})`,
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.availability.deleteMany({ where: { serviceId } }),
      this.prisma.availability.createMany({
        data: dto.slots.map((s) => ({ ...s, serviceId })),
      }),
    ]);

    return this.prisma.availability.findMany({
      where: { serviceId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async getAvailability(userId: number, serviceId: number) {
    const profile = await this.getMyProfile(userId);
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service || service.providerId !== profile.id) {
      throw new NotFoundException('Service not found');
    }
    return this.prisma.availability.findMany({
      where: { serviceId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }
    async updateService(userId: number, serviceId: number, slotMinutes: number) {
    const profile = await this.getMyProfile(userId);
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    if (service.providerId !== profile.id) {
      throw new ForbiddenException('This service belongs to another provider');
    }
    return this.prisma.service.update({
      where: { id: serviceId },
      data: { slotMinutes },
    });
  }
    async getMyReviews(userId: number) {
    const profile = await this.getMyProfile(userId);
    return this.prisma.review.findMany({
      where: { providerId: profile.id },
      include: {
        user: { select: { name: true } },
        booking: { select: { service: { select: { title: true, category: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}