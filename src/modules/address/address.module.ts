import { Module } from '@nestjs/common';
import { AddressService } from './address.service.js';
import { AddressController } from './address.controller.js';
import { MapsModule } from '../../utils/maps/maps.module.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Module({
  imports: [MapsModule],
  controllers: [AddressController],
  providers: [AddressService, PrismaService],
  exports: [AddressService],
})
export class AddressModule {}