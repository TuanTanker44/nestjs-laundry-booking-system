import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { MapsModule } from '../../utils/maps/maps.module.js';
import { StoreController } from './store.controller.js';
import { StoreService } from './store.service.js';

@Module({
  imports: [PrismaModule, MapsModule],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
