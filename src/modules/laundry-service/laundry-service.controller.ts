import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { RoleGuard } from '../auth/guards/role.guard.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { LaundryServiceService } from './laundry-service.service.js';
import { CreateLaundryServiceDto } from './dto/create-laundry-service.dto.js';
import { UpdateLaundryServiceDto } from './dto/update-laundry-service.dto.js';
import { QueryLaundryServiceDto } from './dto/query-laundry-service.dto.js';

@Controller('stores/:storeId/services')
export class LaundryServiceController {
  constructor(private readonly laundryService: LaundryServiceService) {}

  // GET /stores/:storeId/services?pricing_unit=&search= (public)
  @Get()
  async findAll(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() query: QueryLaundryServiceDto,
  ) {
    return { data: await this.laundryService.findAllActive(storeId, query) };
  }

  // GET /stores/:storeId/services/manage — admin / staff được gán (gồm cả inactive).
  // Phải khai báo trước ':serviceId' để 'manage' không bị hiểu là id.
  @Get('manage')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin', 'laundry_staff')
  async findManageable(
    @CurrentUser() user: Express.User,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() query: QueryLaundryServiceDto,
  ) {
    return {
      data: await this.laundryService.findAllManageable(user, storeId, query),
    };
  }

  // GET /stores/:storeId/services/:serviceId (public)
  @Get(':serviceId')
  async findOne(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ) {
    return {
      data: await this.laundryService.findActiveById(storeId, serviceId),
    };
  }

  // POST /stores/:storeId/services — admin / staff được gán
  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin', 'laundry_staff')
  async create(
    @CurrentUser() user: Express.User,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: CreateLaundryServiceDto,
  ) {
    return {
      message: 'Service created successfully',
      data: await this.laundryService.create(user, storeId, dto),
    };
  }

  // PATCH /stores/:storeId/services/:serviceId
  @Patch(':serviceId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin', 'laundry_staff')
  async update(
    @CurrentUser() user: Express.User,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Body() dto: UpdateLaundryServiceDto,
  ) {
    return {
      message: 'Service updated successfully',
      data: await this.laundryService.update(user, storeId, serviceId, dto),
    };
  }

  // DELETE /stores/:storeId/services/:serviceId (xóa mềm)
  @Delete(':serviceId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin', 'laundry_staff')
  deactivate(
    @CurrentUser() user: Express.User,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('serviceId', ParseIntPipe) serviceId: number,
  ) {
    return this.laundryService.deactivate(user, storeId, serviceId);
  }
}
