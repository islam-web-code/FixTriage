import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { PublicProvidersController } from './public-providers.controller';

@Module({
  controllers: [ProvidersController, PublicProvidersController],
  providers: [ProvidersService],
})
export class ProvidersModule {}