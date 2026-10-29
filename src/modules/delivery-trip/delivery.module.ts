import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { MapsModule } from '../../utils/maps/maps.module.js';
import { DeliveryController } from './delivery.controller.js';
import { DeliveryFeeService } from './delivery-fee.service.js';

@Module({
  imports: [PrismaModule, MapsModule],
  controllers: [DeliveryController],
  providers: [DeliveryFeeService],
  exports: [DeliveryFeeService],
})
export class DeliveryModule {}
