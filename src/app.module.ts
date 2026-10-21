import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './redis/redis.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { AddressModule } from './modules/address/address.module.js';
import { StoreModule } from './modules/store/store.module.js';
import { StoreScheduleModule } from './modules/store-schedule/store-schedule.module.js';
import { LaundryServiceModule } from './modules/laundry-service/laundry-service.module.js';
import { validateEnv } from './config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    AddressModule,
    StoreModule,
    StoreScheduleModule,
    LaundryServiceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
