import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { PromotionController } from './promotion.controller.js';
import { PromotionService } from './promotion.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PromotionController],
  providers: [PromotionService],
  exports: [PromotionService],
})
export class PromotionModule {}
