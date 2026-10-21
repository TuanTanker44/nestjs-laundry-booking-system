import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { RoleGuard } from '../auth/guards/role.guard.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { StoreScheduleService } from './store-schedule.service.js';
import { SetWeeklyScheduleDto } from './dto/set-weekly-schedule.dto.js';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto.js';
import {
  QueryAvailableSlotsDto,
  QueryScheduleExceptionsDto,
} from './dto/query-schedule.dto.js';

@Controller('stores/:storeId')
export class StoreScheduleController {
  constructor(private readonly scheduleService: StoreScheduleService) {}

  // GET /stores/:storeId/schedules (public)
  @Get('schedules')
  async getWeekly(@Param('storeId', ParseIntPipe) storeId: number) {
    return { data: await this.scheduleService.getWeeklySchedule(storeId) };
  }

  // PUT /stores/:storeId/schedules — admin hoặc staff được gán
  @Put('schedules')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin', 'laundry_staff')
  async setWeekly(
    @CurrentUser() user: Express.User,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: SetWeeklyScheduleDto,
  ) {
    return {
      message: 'Weekly schedule updated successfully',
      data: await this.scheduleService.setWeeklySchedule(user, storeId, dto),
    };
  }

  // GET /stores/:storeId/schedule-exceptions?from=&to= (public)
  @Get('schedule-exceptions')
  async listExceptions(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() query: QueryScheduleExceptionsDto,
  ) {
    return { data: await this.scheduleService.listExceptions(storeId, query) };
  }

  // POST /stores/:storeId/schedule-exceptions — admin hoặc staff được gán
  @Post('schedule-exceptions')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin', 'laundry_staff')
  async createException(
    @CurrentUser() user: Express.User,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: CreateScheduleExceptionDto,
  ) {
    return {
      message: 'Schedule exception created successfully',
      data: await this.scheduleService.createException(user, storeId, dto),
    };
  }

  // DELETE /stores/:storeId/schedule-exceptions/:exceptionId
  @Delete('schedule-exceptions/:exceptionId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin', 'laundry_staff')
  deleteException(
    @CurrentUser() user: Express.User,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('exceptionId', ParseIntPipe) exceptionId: number,
  ) {
    return this.scheduleService.deleteException(user, storeId, exceptionId);
  }

  // GET /stores/:storeId/available-slots?date=YYYY-MM-DD (public)
  @Get('available-slots')
  async availableSlots(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() query: QueryAvailableSlotsDto,
  ) {
    return {
      data: await this.scheduleService.getAvailableSlots(storeId, query.date),
    };
  }
}
