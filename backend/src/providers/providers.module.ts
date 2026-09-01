import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { PublicProvidersController } from './public-providers.controller';
import { GeocodingService } from './geocoding.service';

@Module({
  controllers: [ProvidersController, PublicProvidersController],
  providers: [ProvidersService, GeocodingService],
})
export class ProvidersModule {}