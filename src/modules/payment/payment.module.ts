import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { StoreModule } from '../store/store.module.js';
import { MomoService } from './gateways/momo.service.js';
import { VnpayService } from './gateways/vnpay.service.js';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';

@Module({
  imports: [PrismaModule, StoreModule],
  controllers: [PaymentController],
  providers: [PaymentService, VnpayService, MomoService],
})
export class PaymentModule {}
