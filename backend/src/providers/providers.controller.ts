import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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

  @Put('profile')
  updateProfile(@Request() req, @Body() dto: CreateProfileDto) {
    return this.providersService.updateProfile(req.user.userId, dto);
  }

  @Post('services')
  addService(@Request() req, @Body() dto: CreateServiceDto) {
    return this.providersService.addService(req.user.userId, dto);
  }

  @Delete('services/:id')
  deleteService(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.providersService.deleteService(req.user.userId, id);
  }
}