import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

  async createProfile(userId: number, dto: CreateProfileDto) {
    const existing = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('Provider profile already exists');
    }

    const profile = await this.prisma.providerProfile.create({
      data: { userId, ...dto },
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
    await this.getMyProfile(userId);
    return this.prisma.providerProfile.update({
      where: { userId },
      data: dto,
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
}