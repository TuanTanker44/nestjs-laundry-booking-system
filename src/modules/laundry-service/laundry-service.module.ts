import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { StoreModule } from '../store/store.module.js';
import { GlobalServiceController } from './global-service.controller.js';
import { LaundryServiceController } from './laundry-service.controller.js';
import { LaundryServiceService } from './laundry-service.service.js';

@Module({
  imports: [PrismaModule, StoreModule],
  controllers: [LaundryServiceController, GlobalServiceController],
  providers: [LaundryServiceService],
  exports: [LaundryServiceService],
})
export class LaundryServiceModule {}
