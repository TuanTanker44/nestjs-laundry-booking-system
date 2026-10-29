import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { AddressModule } from './modules/address/address.module.js';
import { StoreModule } from './modules/store/store.module.js';
import { StoreScheduleModule } from './modules/store-schedule/store-schedule.module.js';
import { LaundryServiceModule } from './modules/laundry-service/laundry-service.module.js';
import { PromotionModule } from './modules/promotion/promotion.module.js';
import { BookingModule } from './modules/booking/booking.module.js';
import { PaymentModule } from './modules/payment/payment.module.js';
import { DeliveryModule } from './modules/delivery-trip/delivery.module.js';
import { validateEnv } from './config/env.validation.js';
import { EmailModule } from './utils/email/email.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Khi test (Vitest đặt NODE_ENV=test) không đọc `.env` của môi trường dev,
      // khớp với vitest.env.ts. File đứng trước được ưu tiên.
      envFilePath:
        process.env.NODE_ENV === 'test'
          ? ['.env.test.local', '.env.test']
          : '.env',
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    EmailModule,
    AuthModule,
    AddressModule,
    StoreModule,
    StoreScheduleModule,
    LaundryServiceModule,
    PromotionModule,
    BookingModule,
    PaymentModule,
    DeliveryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
