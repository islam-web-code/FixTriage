import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

@Controller('providers')
export class PublicProvidersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async listProviders(@Query('category') category?: string) {
    return this.prisma.providerProfile.findMany({
      where: category
        ? { services: { some: { category } } }
        : undefined,
      include: {
        user: { select: { name: true } },
        services: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  async getProvider(@Param('id', ParseIntPipe) id: number) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        services: true,
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!provider) {
      throw new NotFoundException('Provider not found');
    }
    return provider;
  }
}