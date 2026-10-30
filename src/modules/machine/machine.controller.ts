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
import { MachineService } from './machine.service.js';
import { AssignMachineDto } from './dto/assign-machine.dto.js';
import { CreateMachineDto } from './dto/create-machine.dto.js';
import { QueryMachineDto } from './dto/query-machine.dto.js';
import { QueryUsageLogDto } from './dto/query-usage-log.dto.js';
import { UpdateMachineDto } from './dto/update-machine.dto.js';

// Máy là dữ liệu nội bộ: không có route public, chỉ admin / staff được gán vào cửa hàng.
@Controller('stores/:storeId/machines')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('admin', 'laundry_staff')
export class MachineController {
  constructor(private readonly machineService: MachineService) {}

  // GET /stores/:storeId/machines?type=&status=&page=&limit=
  @Get()
  findAll(
    @CurrentUser() user: Express.User,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() query: QueryMachineDto,
  ) {
    return this.machineService.findAll(user, storeId, query);
  }

  // POST /stores/:storeId/machines
  @Post()
  async create(
    @CurrentUser() user: Express.User,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: CreateMachineDto,
  ) {
    return {
      message: 'Machine created successfully',
      data: await this.machineService.create(user, storeId, dto),
    };
  }

  // GET /stores/:storeId/machines/:machineId
  @Get(':machineId')
  async findOne(
    @CurrentUser() user: Express.User,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('machineId', ParseIntPipe) machineId: number,
  ) {
    return { data: await this.machineService.findOne(user, storeId, machineId) };
  }

  // PATCH /stores/:storeId/machines/:machineId
  @Patch(':machineId')
  async update(
    @CurrentUser() user: Express.User,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('machineId', ParseIntPipe) machineId: number,
    @Body() dto: UpdateMachineDto,
  ) {
    return {
      message: 'Machine updated successfully',
      data: await this.machineService.update(user, storeId, machineId, dto),
    };
  }

  // DELETE /stores/:storeId/machines/:machineId — chỉ khi chưa có lịch sử sử dụng
  @Delete(':machineId')
  remove(
    @CurrentUser() user: Express.User,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('machineId', ParseIntPipe) machineId: number,
  ) {
    return this.machineService.remove(user, storeId, machineId);
  }

  // GET /stores/:storeId/machines/:machineId/usage-logs?from=&to=&page=&limit=
  @Get(':machineId/usage-logs')
  findUsageLogs(
    @CurrentUser() user: Express.User,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('machineId', ParseIntPipe) machineId: number,
    @Query() query: QueryUsageLogDto,
  ) {
    return this.machineService.findUsageLogs(user, storeId, machineId, query);
  }

  // POST /stores/:storeId/machines/:machineId/assign — gán máy cho đơn đang processing
  @Post(':machineId/assign')
  async assign(
    @CurrentUser() user: Express.User,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('machineId', ParseIntPipe) machineId: number,
    @Body() dto: AssignMachineDto,
  ) {
    return {
      message: 'Machine assigned successfully',
      data: await this.machineService.assign(user, storeId, machineId, dto),
    };
  }

  // POST /stores/:storeId/machines/:machineId/release — nhả máy, về idle
  @Post(':machineId/release')
  async release(
    @CurrentUser() user: Express.User,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('machineId', ParseIntPipe) machineId: number,
  ) {
    return {
      message: 'Machine released successfully',
      data: await this.machineService.release(user, storeId, machineId),
    };
  }
}
