import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { RoleGuard } from '../auth/guards/role.guard.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { LaundryServiceService } from './laundry-service.service.js';
import { UpdateLaundryServiceDto } from './dto/update-laundry-service.dto.js';
import { QueryLaundryServiceDto } from './dto/query-laundry-service.dto.js';

/**
 * Dịch vụ dùng chung cho mọi cửa hàng (services.store_id = null).
 * Chỉ admin được xem và sửa.
 */
@Controller('services')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('admin')
export class GlobalServiceController {
  constructor(private readonly laundryService: LaundryServiceService) {}

  // GET /services?pricing_unit=&search=&status=
  @Get()
  async findAll(@Query() query: QueryLaundryServiceDto) {
    return { data: await this.laundryService.findAllGlobal(query) };
  }

  // PATCH /services/:serviceId
  @Patch(':serviceId')
  async update(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Body() dto: UpdateLaundryServiceDto,
  ) {
    return {
      message: 'Global service updated successfully',
      data: await this.laundryService.updateGlobal(serviceId, dto),
    };
  }
}
