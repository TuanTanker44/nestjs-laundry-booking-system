import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { StoreModule } from '../store/store.module.js';
import { StoreScheduleController } from './store-schedule.controller.js';
import { StoreScheduleService } from './store-schedule.service.js';

@Module({
  imports: [PrismaModule, StoreModule],
  controllers: [StoreScheduleController],
  providers: [StoreScheduleService],
  // BookingModule sau này dùng getAvailableSlots để kiểm tra slot còn chỗ.
  exports: [StoreScheduleService],
})
export class StoreScheduleModule {}
