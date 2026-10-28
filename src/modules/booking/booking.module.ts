import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { PaymentModule } from '../payment/payment.module.js';
import { PromotionModule } from '../promotion/promotion.module.js';
import { StoreModule } from '../store/store.module.js';
import { StoreScheduleModule } from '../store-schedule/store-schedule.module.js';
import { BookingController } from './booking.controller.js';
import { BookingService } from './booking.service.js';

@Module({
  imports: [
    PrismaModule,
    StoreModule,
    StoreScheduleModule,
    PromotionModule,
    PaymentModule,
  ],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
