import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { RoleGuard } from '../auth/guards/role.guard.js';
import { DeliveryFeeService } from './delivery-fee.service.js';
import { DeliveryFeeQueryDto } from './dto/delivery-fee-query.dto.js';

@Controller('delivery')
@UseGuards(JwtAuthGuard, RoleGuard)
export class DeliveryController {
  constructor(private readonly deliveryFeeService: DeliveryFeeService) {}

  // GET /delivery/fee?store_id=&pickup_address_id=&delivery_address_id= — khách xem trước phí giao.
  // Con số này để hiển thị; POST /bookings/quote và POST /bookings tự tính lại ở server.
  @Get('fee')
  @Roles('customer')
  async fee(
    @CurrentUser() user: Express.User,
    @Query() query: DeliveryFeeQueryDto,
  ) {
    return {
      data: await this.deliveryFeeService.quote(
        user.id,
        query.store_id,
        query.pickup_address_id,
        query.delivery_address_id ?? query.pickup_address_id,
      ),
    };
  }
}
