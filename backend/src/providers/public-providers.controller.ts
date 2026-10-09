import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SlotsService } from '../bookings/slots.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('providers')
export class PublicProvidersController {
  constructor(
    private prisma: PrismaService,
    private slotsService: SlotsService,
  ) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async listProviders(@Request() req, @Query('category') category?: string) {
    const viewerId = req.user?.userId;

    return this.prisma.providerProfile.findMany({
      where: {
        services: category ? { some: { category } } : { some: {} },
        ...(viewerId ? { userId: { not: viewerId } } : {}),
      },
      include: {
        user: { select: { name: true } },
        services: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('services/:id/slots')
  getSlots(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date: string,
  ) {
    return this.slotsService.getSlots(id, date);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async getProvider(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        services: { include: { availability: true } },
        reviews: {
          include: {
            user: { select: { name: true } },
            booking: { select: { service: { select: { title: true, category: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!provider || provider.services.length === 0) {
      throw new NotFoundException('Provider not found');
    }
    if (req.user?.userId && provider.userId === req.user.userId) {
      throw new NotFoundException('Provider not found');
    }
    return provider;
  }
}