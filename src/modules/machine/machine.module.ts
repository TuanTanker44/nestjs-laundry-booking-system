import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { StoreModule } from '../store/store.module.js';
import { MachineController } from './machine.controller.js';
import { MachineService } from './machine.service.js';

@Module({
  imports: [PrismaModule, StoreModule],
  controllers: [MachineController],
  providers: [MachineService],
  exports: [MachineService],
})
export class MachineModule {}
