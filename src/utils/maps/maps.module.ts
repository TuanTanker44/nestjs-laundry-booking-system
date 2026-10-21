import { Module } from '@nestjs/common';
import { MapsService } from './maps.service.js';

@Module({
  providers: [MapsService],
  exports: [MapsService],
})
export class MapsModule {}