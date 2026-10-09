import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@UseGuards(JwtAuthGuard)
@Controller('providers/me')
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Post('profile')
  createProfile(@Request() req, @Body() dto: CreateProfileDto) {
    return this.providersService.createProfile(req.user.userId, dto);
  }

  @Get('profile')
  getMyProfile(@Request() req) {
    return this.providersService.getMyProfile(req.user.userId);
  }

  @Get('reviews')
  getMyReviews(@Request() req) {
    return this.providersService.getMyReviews(req.user.userId);
  }

  @Put('profile')
  updateProfile(@Request() req, @Body() dto: CreateProfileDto) {
    return this.providersService.updateProfile(req.user.userId, dto);
  }

  @Post('services')
  addService(@Request() req, @Body() dto: CreateServiceDto) {
    return this.providersService.addService(req.user.userId, dto);
  }

  @Patch('services/:id')
  updateService(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.providersService.updateService(req.user.userId, id, dto.slotMinutes);
  }

  @Delete('services/:id')
  deleteService(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.providersService.deleteService(req.user.userId, id);
  }

  @Get('services/:id/availability')
  getAvailability(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.providersService.getAvailability(req.user.userId, id);
  }

  @Put('services/:id/availability')
  setAvailability(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.providersService.setAvailability(req.user.userId, id, dto);
  }
}