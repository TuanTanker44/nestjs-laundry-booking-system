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
import { StoreService } from './store.service.js';
import { CreateStoreDto } from './dto/create-store.dto.js';
import { UpdateStoreDto } from './dto/update-store.dto.js';
import { QueryStoreDto } from './dto/query-store.dto.js';
import { AssignStaffDto } from './dto/assign-staff.dto.js';

@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // GET /stores?search=&page=&limit=&lat=&lng=  (public)
  @Get()
  findAll(@Query() query: QueryStoreDto) {
    return this.storeService.findAllActive(query);
  }

  // GET /stores/manage — admin: mọi cửa hàng; staff: cửa hàng được gán.
  // Phải khai báo trước ':id' để 'manage' không bị hiểu là id.
  @Get('manage')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin', 'laundry_staff')
  findManageable(
    @CurrentUser() user: Express.User,
    @Query() query: QueryStoreDto,
  ) {
    return this.storeService.findAllManageable(user, query);
  }

  // GET /stores/:id  (public)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return { data: await this.storeService.findActiveById(id) };
  }

  // POST /stores — admin
  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  async create(
    @CurrentUser() user: Express.User,
    @Body() dto: CreateStoreDto,
  ) {
    return {
      message: 'Store created successfully',
      data: await this.storeService.create(user, dto),
    };
  }

  // PATCH /stores/:id — admin hoặc staff được gán
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin', 'laundry_staff')
  async update(
    @CurrentUser() user: Express.User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStoreDto,
  ) {
    return {
      message: 'Store updated successfully',
      data: await this.storeService.update(user, id, dto),
    };
  }

  // DELETE /stores/:id — admin (xóa mềm)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.deactivate(id);
  }

  // POST /stores/:id/staff — admin gán nhân viên vào cửa hàng
  @Post(':id/staff')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  assignStaff(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignStaffDto,
  ) {
    return this.storeService.assignStaff(id, dto.staff_id);
  }

  // DELETE /stores/:id/staff/:staffId — admin gỡ nhân viên khỏi cửa hàng
  @Delete(':id/staff/:staffId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  unassignStaff(
    @Param('id', ParseIntPipe) id: number,
    @Param('staffId', ParseIntPipe) staffId: number,
  ) {
    return this.storeService.unassignStaff(id, staffId);
  }
}
