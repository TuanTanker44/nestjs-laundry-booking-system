import {
  Body,
  Controller,
  DefaultValuePipe,
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
import { BookingService } from './booking.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { QueryBookingDto } from './dto/query-booking.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';
import { CancelBookingDto } from './dto/cancel-booking.dto.js';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RoleGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // POST /bookings/quote — khách xem trước giá, không tạo đơn
  @Post('quote')
  @Roles('customer')
  async quote(
    @CurrentUser() user: Express.User,
    @Body() dto: CreateBookingDto,
  ) {
    return { data: await this.bookingService.quote(user, dto) };
  }

  // POST /bookings — khách đặt lịch
  @Post()
  @Roles('customer')
  async create(
    @CurrentUser() user: Express.User,
    @Body() dto: CreateBookingDto,
  ) {
    return {
      message: 'Booking created successfully',
      data: await this.bookingService.create(user, dto),
    };
  }

  // GET /bookings?status=&page=&limit= — đơn của tôi
  @Get()
  @Roles('customer')
  findMine(@CurrentUser() user: Express.User, @Query() query: QueryBookingDto) {
    return this.bookingService.findMine(user, query);
  }

  // GET /bookings/manage?store_id=&date=&status= — admin: mọi đơn; staff: cửa hàng được gán.
  // Phải khai báo trước ':id' để 'manage' không bị hiểu là id.
  @Get('manage')
  @Roles('admin', 'laundry_staff')
  findManageable(
    @CurrentUser() user: Express.User,
    @Query() query: QueryBookingDto,
  ) {
    return this.bookingService.findManageable(user, query);
  }

  @Get("staff")
  @Roles("laundry_staff")
  async getStaffBookings(
    @CurrentUser("id") staffId: number,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.bookingService.getStaffBookings(
      staffId,
      page,
      limit,
    );
  }

  @Get("staff/:bookingId")
  @Roles("laundry_staff")
  async getStaffBookingDetail(
    @CurrentUser("id") staffId: number,
    @Param("bookingId", ParseIntPipe) bookingId: number,
  ) {
    return this.bookingService.getStaffBookingDetail(
      staffId,
      bookingId,
    );
  }

  // GET /bookings/:id — chủ đơn, staff của cửa hàng, admin
  @Get(':id')
  @Roles('customer', 'admin', 'laundry_staff')
  async findOne(
    @CurrentUser() user: Express.User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return { data: await this.bookingService.findOne(user, id) };
  }

  // POST /bookings/:id/cancel — chủ đơn, staff của cửa hàng, admin
  @Post(':id/cancel')
  @Roles('customer', 'admin', 'laundry_staff')
  async cancel(
    @CurrentUser() user: Express.User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelBookingDto,
  ) {
    return {
      message: 'Booking cancelled successfully',
      data: await this.bookingService.cancel(user, id, dto),
    };
  }

  // PATCH /bookings/:id/status — admin / staff của cửa hàng
  @Patch(':id/status')
  @Roles('admin', 'laundry_staff')
  async changeStatus(
    @CurrentUser() user: Express.User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return {
      message: 'Booking status updated successfully',
      data: await this.bookingService.changeStatus(user, id, dto),
    };
  }
}
