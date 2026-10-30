import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Redirect,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { RoleGuard } from '../auth/guards/role.guard.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PaymentService } from './payment.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { QueryStorePaymentDto } from './dto/query-store-payment.dto.js';
import {
  isOnlinePaymentMethod,
  type CallbackOutcome,
} from './payment.types.js';

// VNPay phản hồi IPN bằng mã riêng của họ (HTTP luôn 200).
const VNPAY_RESPONSES: Record<CallbackOutcome, { RspCode: string; Message: string }> = {
  ok: { RspCode: '00', Message: 'Confirm Success' },
  invalid_signature: { RspCode: '97', Message: 'Invalid signature' },
  not_found: { RspCode: '01', Message: 'Order not found' },
  invalid_amount: { RspCode: '04', Message: 'Invalid amount' },
  already_confirmed: { RspCode: '02', Message: 'Order already confirmed' },
};

/** VNPay chỉ nhận IPv4 dạng thường: bỏ tiền tố IPv6-mapped, ::1 -> 127.0.0.1. */
function normalizeIp(ip: string | undefined): string {
  if (!ip || ip === '::1') {
    return '127.0.0.1';
  }

  return ip.replace(/^::ffff:/, '');
}

// Guard gắn riêng từng route: các endpoint IPN / return do cổng thanh toán và
// trình duyệt gọi, không có JWT; chúng được bảo vệ bằng chữ ký của cổng.
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // POST /payments — khách tạo giao dịch, nhận payment_url để chuyển sang cổng
  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('customer')
  async create(
    @CurrentUser() user: Express.User,
    @Body() dto: CreatePaymentDto,
    @Req() req: Request,
  ) {
    return {
      message: 'Payment created successfully',
      data: await this.paymentService.create(user, dto, normalizeIp(req.ip)),
    };
  }

  // GET /payments?booking_id= — lịch sử thanh toán của đơn
  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('customer', 'admin', 'laundry_staff')
  async listByBooking(
    @CurrentUser() user: Express.User,
    @Query('booking_id', ParseIntPipe) bookingId: number,
  ) {
    return { data: await this.paymentService.listByBooking(user, bookingId) };
  }

  // GET /payments/stores/:storeId?status=&method=&page=&limit= — admin / staff được gán
  @Get('stores/:storeId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin', 'laundry_staff')
  listByStore(
    @CurrentUser() user: Express.User,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() query: QueryStorePaymentDto,
  ) {
    return this.paymentService.listByStore(user, storeId, query);
  }

  // GET /payments/vnpay/ipn — server VNPay gọi (khai báo trước ':method/return')
  @Get('vnpay/ipn')
  async vnpayIpn(@Query() query: Record<string, string>) {
    return VNPAY_RESPONSES[await this.paymentService.handleIpn('vnpay', query)];
  }

  // POST /payments/momo/ipn — server MoMo gọi, yêu cầu phản hồi 204
  @Post('momo/ipn')
  @HttpCode(204)
  async momoIpn(@Body() body: Record<string, unknown>) {
    const outcome = await this.paymentService.handleIpn('momo', body);

    if (outcome !== 'ok' && outcome !== 'already_confirmed') {
      throw new BadRequestException(outcome);
    }
  }

  // GET /payments/:method/return — trình duyệt khách quay về, chỉ redirect sang frontend
  @Get(':method/return')
  @Redirect()
  async returnFromGateway(
    @Param('method') method: string,
    @Query() query: Record<string, string>,
  ) {
    if (!isOnlinePaymentMethod(method)) {
      throw new NotFoundException();
    }

    return { url: await this.paymentService.resolveReturn(method, query) };
  }
}
