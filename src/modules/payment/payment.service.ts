import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  PENDING_PAYMENT_HOLD_MINUTES,
  pendingHoldCutoff,
} from '../../utils/slot-capacity.util.js';
import { StoreService } from '../store/store.service.js';
import { MomoService } from './gateways/momo.service.js';
import { VnpayService } from './gateways/vnpay.service.js';
import type { CreatePaymentDto } from './dto/create-payment.dto.js';
import type {
  CallbackOutcome,
  OnlinePaymentMethod,
  PaymentGateway,
} from './payment.types.js';

interface Actor {
  id: number;
  role: string;
}

const MIN_ONLINE_AMOUNT = 1000;
// Khách trả tiền sát giờ hết hạn giữ chỗ thì IPN có thể về trễ vài phút.
const PAYMENT_GRACE_MINUTES = 2;
const TXN_REF_PATTERN = /^P(\d+)T\d+$/;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly gateways: Record<OnlinePaymentMethod, PaymentGateway>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly storeService: StoreService,
    vnpay: VnpayService,
    momo: MomoService,
  ) {
    this.gateways = { vnpay, momo };
  }

  // Mã gửi cổng: P{payment.id}T{unix giây}. Chỉ chữ + số (VNPay không nhận ký tự lạ);
  // phần T giữ mã không trùng khi DB dev bị reset và id chạy lại từ 1.
  private buildTxnRef(paymentId: number): string {
    return `P${paymentId}T${Math.floor(Date.now() / 1000)}`;
  }

  private parseTxnRef(txnRef: string): number | null {
    const match = TXN_REF_PATTERN.exec(txnRef);

    return match ? Number(match[1]) : null;
  }

  // -------------------------------------------------------------- Tạo giao dịch

  /** Khách tạo giao dịch cho đơn pending_payment của mình, trả về link sang cổng. */
  async create(actor: Actor, dto: CreatePaymentDto, clientIp: string) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: dto.booking_id },
      select: {
        id: true,
        booking_code: true,
        customer_id: true,
        status: true,
        created_at: true,
        estimated_price: true,
      },
    });

    // Đơn của người khác coi như không tồn tại (giống BookingService).
    if (!booking || booking.customer_id !== actor.id) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'pending_payment') {
      throw new BadRequestException(
        `A booking in status "${booking.status}" cannot be paid`,
      );
    }

    const expireAt = new Date(
      booking.created_at.getTime() + PENDING_PAYMENT_HOLD_MINUTES * 60_000,
    );

    if (expireAt.getTime() <= Date.now()) {
      throw new BadRequestException('The payment window of this booking has expired');
    }

    const paid = await this.prisma.payments.findFirst({
      where: { booking_id: booking.id, status: 'success' },
      select: { id: true },
    });

    if (paid) {
      throw new ConflictException('This booking has already been paid');
    }

    // VND không có số lẻ; lưu đúng số đã làm tròn để đối chiếu với số cổng báo về.
    const amount = Math.round(booking.estimated_price.toNumber());

    if (amount < MIN_ONLINE_AMOUNT) {
      throw new BadRequestException(
        `Online payment requires at least ${MIN_ONLINE_AMOUNT} VND`,
      );
    }

    const payment = await this.prisma.payments.create({
      data: {
        booking_id: booking.id,
        payment_type: 'full',
        amount,
        method: dto.method,
      },
    });

    try {
      const link = await this.gateways[dto.method].createPayment({
        txnRef: this.buildTxnRef(payment.id),
        amount,
        orderInfo: `Thanh toan don ${booking.booking_code}`,
        expireAt,
        clientIp,
      });

      // Lưu link để khách mở lại đơn (hoặc đổi thiết bị) vẫn thấy được QR / link thanh toán.
      await this.prisma.payments.update({
        where: { id: payment.id },
        data: {
          payment_url: link.paymentUrl,
          qr_code_url: link.qrCodeUrl ?? null,
          expires_at: expireAt,
        },
      });

      return {
        payment_id: payment.id,
        method: dto.method,
        amount,
        payment_url: link.paymentUrl,
        qr_code_url: link.qrCodeUrl ?? null,
        expires_at: expireAt,
      };
    } catch (error) {
      // Chưa có link nào được cấp nên giao dịch này không thể thành công.
      await this.prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });

      throw error;
    }
  }

  // ------------------------------------------------------------------ Callback

  /**
   * Xử lý IPN từ cổng: nơi DUY NHẤT đổi trạng thái thanh toán / đơn.
   * Idempotent: cổng gọi lại nhiều lần vẫn chỉ confirm một lần.
   */
  async handleIpn(
    method: OnlinePaymentMethod,
    payload: Record<string, unknown>,
  ): Promise<CallbackOutcome> {
    const result = this.gateways[method].verifyCallback(payload);

    if (!result.validSignature) {
      return 'invalid_signature';
    }

    const paymentId = this.parseTxnRef(result.txnRef);
    const payment = paymentId
      ? await this.prisma.payments.findUnique({ where: { id: paymentId } })
      : null;

    if (!payment || payment.method !== method) {
      return 'not_found';
    }

    // Số tiền lấy từ DB làm chuẩn, không tin số tiền trên callback.
    if (payment.amount.toNumber() !== result.amount) {
      return 'invalid_amount';
    }

    if (payment.status !== 'pending') {
      return 'already_confirmed';
    }

    const raw = result.raw as Prisma.InputJsonObject;

    if (!result.success) {
      await this.prisma.payments.updateMany({
        where: { id: payment.id, status: 'pending' },
        data: { status: 'failed', raw_response: raw },
      });

      return 'ok';
    }

    const lateRefund = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.payments.updateMany({
        // Chỉ ghi nhận nếu chưa có IPN nào xử lý xong trước đó.
        where: { id: payment.id, status: 'pending' },
        data: {
          status: 'success',
          paid_at: new Date(),
          provider_transaction_id: result.providerTransactionId,
          raw_response: raw,
        },
      });

      if (count === 0) {
        return null;
      }

      const confirmed = await tx.bookings.updateMany({
        where: {
          id: payment.booking_id,
          status: 'pending_payment',
          created_at: {
            gte: pendingHoldCutoff(
              new Date(Date.now() - PAYMENT_GRACE_MINUTES * 60_000),
            ),
          },
        },
        data: { status: 'confirmed' },
      });

      if (confirmed.count > 0) {
        return false;
      }

      // Đơn đã bị hủy / quá hạn giữ chỗ (slot có thể đã nhả cho người khác): vẫn ghi
      // nhận tiền đã thu và đánh dấu để hoàn thủ công, không tự confirm lại đơn.
      await tx.payments.update({
        where: { id: payment.id },
        data: { raw_response: { ...raw, needs_manual_refund: true } },
      });

      return true;
    });

    if (lateRefund === null) {
      return 'already_confirmed';
    }

    if (lateRefund) {
      this.logger.warn(
        `Payment ${payment.id} (${payment.amount.toString()} VND, booking ${payment.booking_id}) ` +
          'succeeded after the booking was cancelled or expired: manual refund required',
      );
    }

    return 'ok';
  }

  /**
   * Trình duyệt khách quay về từ cổng. Chỉ để chọn trang hiển thị kết quả,
   * KHÔNG đổi trạng thái (trạng thái thật chỉ đến từ IPN).
   */
  resolveReturn(method: OnlinePaymentMethod, payload: Record<string, unknown>) {
    const result = this.gateways[method].verifyCallback(payload);

    if (!result.validSignature) {
      return this.resultUrl(null, 'invalid');
    }

    return this.resultUrl(
      this.parseTxnRef(result.txnRef),
      result.success ? 'success' : 'failed',
    );
  }

  /** URL trang kết quả trên frontend (cấu hình qua PAYMENT_RESULT_URL, `:bookingId` được thay vào). */
  private async resultUrl(
    paymentId: number | null,
    status: 'success' | 'failed' | 'invalid',
  ): Promise<string> {
    const payment = paymentId
      ? await this.prisma.payments.findUnique({
          where: { id: paymentId },
          select: { booking_id: true },
        })
      : null;

    const template =
      this.config.get<string>('PAYMENT_RESULT_URL') ??
      'http://localhost:5173/customer/bookings/:bookingId';
    const url = new URL(
      template.replace(':bookingId', String(payment?.booking_id ?? '')),
    );

    url.searchParams.set('payment', payment ? status : 'invalid');

    return url.toString();
  }

  // ---------------------------------------------------------------------- Xem

  /** Lịch sử thanh toán của một đơn: chủ đơn, staff của cửa hàng, admin. */
  async listByBooking(actor: Actor, bookingId: number) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      select: { customer_id: true, store_id: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (actor.role === 'laundry_staff') {
      await this.storeService.assertCanManageStore(actor, booking.store_id);
    } else if (actor.role !== 'admin' && booking.customer_id !== actor.id) {
      throw new NotFoundException('Booking not found');
    }

    const payments = await this.prisma.payments.findMany({
      where: { booking_id: bookingId },
      orderBy: { created_at: 'desc' },
      // Không trả raw_response: chứa dữ liệu thô của cổng thanh toán.
      select: {
        id: true,
        payment_type: true,
        amount: true,
        method: true,
        status: true,
        paid_at: true,
        created_at: true,
        payment_url: true,
        qr_code_url: true,
        expires_at: true,
      },
    });

    const now = Date.now();

    return payments.map(({ payment_url, qr_code_url, expires_at, ...payment }) => {
      // Link thanh toán đã ký chỉ trả cho chủ đơn và khi còn dùng được (đang chờ, chưa hết hạn):
      // staff / admin chỉ xem lịch sử, không cần (và không nên có) link để trả tiền thay khách.
      const resumable =
        actor.role === 'customer' &&
        payment.status === 'pending' &&
        expires_at !== null &&
        expires_at.getTime() > now;

      return {
        ...payment,
        amount: payment.amount.toNumber(),
        payment_url: resumable ? payment_url : null,
        qr_code_url: resumable ? qr_code_url : null,
        expires_at: resumable ? expires_at : null,
      };
    });
  }
}
