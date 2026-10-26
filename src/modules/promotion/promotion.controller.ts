import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { RoleGuard } from '../auth/guards/role.guard.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PromotionService } from './promotion.service.js';
import { CreatePromotionDto } from './dto/create-promotion.dto.js';
import { QueryPromotionDto } from './dto/query-promotion.dto.js';

/** Quản lý mã khuyến mãi: chỉ admin. */
@Controller('promotions')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('admin')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  // GET /promotions?search=&status=&page=&limit=
  @Get()
  findAll(@Query() query: QueryPromotionDto) {
    return this.promotionService.findAll(query);
  }

  // POST /promotions
  @Post()
  async create(
    @CurrentUser() user: Express.User,
    @Body() dto: CreatePromotionDto,
  ) {
    return {
      message: 'Promotion created successfully',
      data: await this.promotionService.create(user, dto),
    };
  }
}
