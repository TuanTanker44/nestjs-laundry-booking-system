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
import {
  asString,
  isOnlinePaymentMethod,
  type CallbackOutcome,
  type GatewayQueryResult,
  type OnlinePaymentMethod,
  type PaymentGateway,
} from './payment.types.js';

type PaymentRecord = Prisma.paymentsGetPayload<object>;

interface Actor {
  id: number;
  role: string;
}

/** Kết quả cuối của một giao dịch, từ IPN hoặc từ việc hỏi lại cổng. */
interface GatewayOutcome {
  success: boolean;
  providerTransactionId: string | null;
  raw: Record<string, unknown>;
}

export type RefundStatus = 'none' | 'refunded' | 'pending';

const MIN_ONLINE_AMOUNT = 1000;
// Khách trả tiền sát giờ hết hạn giữ chỗ thì IPN có thể về trễ vài phút.
const PAYMENT_GRACE_MINUTES = 2;
const TXN_REF_PATTERN = /^P(\d+)T(\d+)$/;
// Giao dịch pending sau bấy nhiêu giây mà chưa có IPN thì bắt đầu hỏi cổng.
const RECONCILE_AFTER_SECONDS = 45;
const RECONCILE_BATCH_SIZE = 50;
// Quá hạn mà vẫn không hỏi được cổng (lỗi mạng / cấu hình) thì bỏ cuộc sau bấy nhiêu phút.
const QUERY_GIVE_UP_MINUTES = 60;
const MAX_REFUND_ATTEMPTS = 5;
const REFUND_RETRY_MINUTES = 5;

/** raw_response lưu dạng JSON bất kỳ; lấy về object để gộp thêm trường. */
function asObject(value: Prisma.JsonValue | null): Prisma.JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {};
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly gateways: Record<OnlinePaymentMethod, PaymentGateway>;
  private readonly refunding = new Set<number>();
  private sweeping = false;

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
  // phần T giữ mã không trùng khi DB dev bị reset và id chạy lại từ 1, và cũng là
  // thời điểm tạo giao dịch mà VNPay đòi kèm khi truy vấn / hoàn tiền.
  private buildTxnRef(paymentId: number, createdAt: Date): string {
    return `P${paymentId}T${Math.floor(createdAt.getTime() / 1000)}`;
  }

  private parseTxnRef(
    txnRef: string,
  ): { paymentId: number; createdAt: Date } | null {
    const match = TXN_REF_PATTERN.exec(txnRef);

    return match
      ? { paymentId: Number(match[1]), createdAt: new Date(Number(match[2]) * 1000) }
      : null;
  }

  /** Mã giao dịch của payment; giao dịch cũ chưa lưu txn_ref thì lấy từ dữ liệu cổng đã báo về. */
  private resolveTxn(payment: PaymentRecord) {
    const raw = asObject(payment.raw_response);
    const txnRef =
      payment.txn_ref ?? (asString(raw.vnp_TxnRef) || asString(raw.orderId));
    const parsed = this.parseTxnRef(txnRef);

    return parsed ? { txnRef, createdAt: parsed.createdAt } : null;
  }

  // -------------------------------------------------------------- Tạo giao dịch

  /**
   * Khách tạo giao dịch cho đơn pending_payment CỦA MÌNH, trả về link sang cổng.
   * Mỗi booking chỉ có một phiên thanh toán đang chờ: còn phiên cùng phương thức
   * chưa hết hạn thì trả lại phiên đó, ngược lại phiên cũ bị đóng (failed) và tạo phiên mới.
   */
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

    // VND không có số lẻ; lưu đúng số đã làm tròn để đối chiếu với số cổng báo về.
    const amount = Math.round(booking.estimated_price.toNumber());

    if (amount < MIN_ONLINE_AMOUNT) {
      throw new BadRequestException(
        `Online payment requires at least ${MIN_ONLINE_AMOUNT} VND`,
      );
    }

    const session = await this.prisma.$transaction(async (tx) => {
      // Khóa theo booking đến hết transaction: hai request tạo giao dịch cùng lúc xếp hàng.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${booking.id}::bigint)`;

      const paid = await tx.payments.findFirst({
        where: { booking_id: booking.id, status: 'success' },
        select: { id: true },
      });

      if (paid) {
        throw new ConflictException('This booking has already been paid');
      }

      const pending = await tx.payments.findFirst({
        where: { booking_id: booking.id, status: 'pending' },
        orderBy: { id: 'desc' },
      });

      if (
        pending?.method === dto.method &&
        pending.payment_url &&
        pending.expires_at &&
        pending.expires_at.getTime() > Date.now()
      ) {
        return { kind: 'resumed' as const, resumed: pending };
      }

      // Đóng phiên cũ. Nếu khách vẫn lỡ trả phiên đó thì IPN về sau sẽ được ghi nhận và tự hoàn tiền.
      await tx.payments.updateMany({
        where: { booking_id: booking.id, status: 'pending' },
        data: { status: 'failed' },
      });

      const created = await tx.payments.create({
        data: {
          booking_id: booking.id,
          payment_type: 'full',
          amount,
          method: dto.method,
          expires_at: expireAt,
        },
      });

      const createdAt = new Date(Math.floor(Date.now() / 1000) * 1000);
      const txnRef = this.buildTxnRef(created.id, createdAt);

      await tx.payments.update({
        where: { id: created.id },
        data: { txn_ref: txnRef },
      });

      return { kind: 'created' as const, created, txnRef, createdAt };
    });

    if (session.kind === 'resumed') {
      const { resumed } = session;

      return {
        payment_id: resumed.id,
        method: dto.method,
        amount: resumed.amount.toNumber(),
        payment_url: resumed.payment_url,
        qr_code_url: resumed.qr_code_url,
        expires_at: resumed.expires_at,
      };
    }

    const { created, txnRef, createdAt } = session;

    try {
      const link = await this.gateways[dto.method].createPayment({
        txnRef,
        amount,
        orderInfo: `Thanh toan don ${booking.booking_code}`,
        expireAt,
        createdAt,
        clientIp,
      });

      // Lưu link để khách mở lại đơn (hoặc đổi thiết bị) vẫn thấy được QR / link thanh toán.
      const { count } = await this.prisma.payments.updateMany({
        where: { id: created.id, status: 'pending' },
        data: {
          payment_url: link.paymentUrl,
          qr_code_url: link.qrCodeUrl ?? null,
        },
      });

      if (count === 0) {
        throw new ConflictException(
          'This payment session was replaced by a newer one, please try again',
        );
      }

      return {
        payment_id: created.id,
        method: dto.method,
        amount,
        payment_url: link.paymentUrl,
        qr_code_url: link.qrCodeUrl ?? null,
        expires_at: expireAt,
      };
    } catch (error) {
      // Chưa có link nào được cấp nên giao dịch này không thể thành công.
      await this.prisma.payments.updateMany({
        where: { id: created.id, status: 'pending' },
        data: { status: 'failed' },
      });

      throw error;
    }
  }

  // ------------------------------------------------------------------ Callback

  /**
   * Xử lý IPN từ cổng. Cùng với việc hỏi lại cổng (reconcilePending) là nơi DUY NHẤT
   * đổi trạng thái thanh toán / đơn. Idempotent: cổng gọi lại nhiều lần vẫn chỉ confirm một lần.
   */
  async handleIpn(
    method: OnlinePaymentMethod,
    payload: Record<string, unknown>,
  ): Promise<CallbackOutcome> {
    const result = this.gateways[method].verifyCallback(payload);

    if (!result.validSignature) {
      return 'invalid_signature';
    }

    const parsed = this.parseTxnRef(result.txnRef);
    const payment = parsed
      ? await this.prisma.payments.findUnique({ where: { id: parsed.paymentId } })
      : null;

    if (!payment || payment.method !== method) {
      return 'not_found';
    }

    // Số tiền lấy từ DB làm chuẩn, không tin số tiền trên callback.
    if (payment.amount.toNumber() !== result.amount) {
      return 'invalid_amount';
    }

    return this.applyOutcome(payment, {
      success: result.success,
      providerTransactionId: result.providerTransactionId,
      raw: result.raw,
    });
  }

  /**
   * Ghi nhận kết quả cuối của một giao dịch (từ IPN hoặc từ việc hỏi lại cổng).
   * Tiền về cho giao dịch đã `failed` (phiên bị thay thế / hết hạn rồi mới trả) vẫn được ghi nhận.
   */
  private async applyOutcome(
    payment: PaymentRecord,
    outcome: GatewayOutcome,
  ): Promise<'ok' | 'already_confirmed'> {
    const raw = outcome.raw as Prisma.InputJsonObject;

    if (!outcome.success) {
      const { count } = await this.prisma.payments.updateMany({
        where: { id: payment.id, status: 'pending' },
        data: { status: 'failed', raw_response: raw },
      });

      return count > 0 ? 'ok' : 'already_confirmed';
    }

    const needsRefund = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.payments.updateMany({
        // Chỉ ghi nhận nếu chưa có IPN nào xử lý xong trước đó.
        where: { id: payment.id, status: { in: ['pending', 'failed'] } },
        data: {
          status: 'success',
          paid_at: new Date(),
          provider_transaction_id: outcome.providerTransactionId,
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
        // Đã trả xong thì phiên chờ còn lại của đơn không còn ý nghĩa.
        await tx.payments.updateMany({
          where: {
            booking_id: payment.booking_id,
            status: 'pending',
            id: { not: payment.id },
          },
          data: { status: 'failed' },
        });

        return false;
      }

      // Đơn đã bị hủy / quá hạn giữ chỗ (slot có thể đã nhả cho người khác) hoặc đã được
      // trả bởi phiên khác: vẫn ghi nhận tiền đã thu, không tự confirm lại đơn, và đánh dấu để hoàn.
      await tx.payments.update({
        where: { id: payment.id },
        data: { raw_response: { ...raw, needs_refund: true } },
      });

      return true;
    });

    if (needsRefund === null) {
      return 'already_confirmed';
    }

    if (needsRefund) {
      this.logger.warn(
        `Payment ${payment.id} (${payment.amount.toString()} VND, booking ${payment.booking_id}) ` +
          'succeeded after the booking was cancelled, expired or already paid: refunding',
      );

      // Không chờ: IPN phải phản hồi cổng nhanh. Hoàn lỗi thì cron thử lại.
      void this.refundPayment(payment.id);
    }

    return 'ok';
  }

  // ------------------------------------------------- Đối soát / hết hạn (cron)

  /**
   * Chạy định kỳ: hỏi cổng về các giao dịch pending (cứu trường hợp IPN bị mất), đánh failed
   * giao dịch đã quá hạn, và thử lại các khoản hoàn tiền chưa xong.
   */
  async sweep() {
    if (this.sweeping) {
      return;
    }

    this.sweeping = true;

    try {
      await this.reconcilePending();
      await this.retryRefunds();
    } finally {
      this.sweeping = false;
    }
  }

  private async reconcilePending() {
    const now = Date.now();
    const candidates = await this.prisma.payments.findMany({
      where: {
        status: 'pending',
        created_at: { lte: new Date(now - RECONCILE_AFTER_SECONDS * 1000) },
      },
      orderBy: { id: 'asc' },
      take: RECONCILE_BATCH_SIZE,
    });

    for (const payment of candidates) {
      try {
        await this.reconcileOne(payment, now);
      } catch (error) {
        this.logger.error(
          `Could not reconcile payment ${payment.id}: ${errorMessage(error)}`,
        );
      }
    }
  }

  private async reconcileOne(payment: PaymentRecord, now: number) {
    // Giao dịch cũ chưa có expires_at: hết hạn cùng lúc với thời gian giữ chỗ của đơn.
    const expiresAt =
      payment.expires_at?.getTime() ??
      payment.created_at.getTime() + PENDING_PAYMENT_HOLD_MINUTES * 60_000;
    const expired = expiresAt + PAYMENT_GRACE_MINUTES * 60_000 <= now;

    const txn = this.resolveTxn(payment);
    let query: GatewayQueryResult | null = null;

    if (txn && isOnlinePaymentMethod(payment.method)) {
      try {
        query = await this.gateways[payment.method].queryTransaction(txn);
      } catch (error) {
        this.logger.warn(
          `Could not query ${payment.method} for payment ${payment.id}: ${errorMessage(error)}`,
        );
      }
    }

    if (query?.state === 'paid') {
      if (query.amount !== payment.amount.toNumber()) {
        this.logger.error(
          `Payment ${payment.id}: gateway reports ${query.amount} VND but ${payment.amount.toString()} was expected`,
        );

        return;
      }

      await this.applyOutcome(payment, {
        success: true,
        providerTransactionId: query.providerTransactionId,
        raw: query.raw,
      });

      return;
    }

    if (query?.state === 'failed') {
      await this.applyOutcome(payment, {
        success: false,
        providerTransactionId: null,
        raw: query.raw,
      });

      return;
    }

    // Chưa trả: hết hạn thì đóng. Hỏi cổng không được thì chờ thêm rồi mới bỏ cuộc,
    // vì có thể khách đã trả mà ta chưa xác nhận được.
    const giveUp = expiresAt + QUERY_GIVE_UP_MINUTES * 60_000 <= now;

    if (expired && (query !== null || giveUp)) {
      await this.prisma.payments.updateMany({
        where: { id: payment.id, status: 'pending' },
        data: { status: 'failed' },
      });
    }
  }

  // ------------------------------------------------------------------ Hoàn tiền

  /**
   * Gọi trong transaction hủy đơn: đóng phiên thanh toán đang chờ và, nếu `refund`,
   * đánh dấu các khoản đã thu là cần hoàn (ghi cùng transaction nên không thể mất dấu).
   * Việc gọi cổng thật làm sau khi transaction commit, xem refundBooking.
   */
  async onBookingCancelled(
    tx: Prisma.TransactionClient,
    bookingId: number,
    refund: boolean,
  ) {
    await tx.payments.updateMany({
      where: { booking_id: bookingId, status: 'pending' },
      data: { status: 'failed' },
    });

    if (!refund) {
      return;
    }

    const paid = await tx.payments.findMany({
      where: { booking_id: bookingId, status: 'success' },
    });

    for (const payment of paid) {
      await tx.payments.update({
        where: { id: payment.id },
        data: {
          raw_response: { ...asObject(payment.raw_response), needs_refund: true },
        },
      });
    }
  }

  /** Hoàn các khoản đang chờ hoàn của một đơn. Không throw: khoản lỗi sẽ được cron thử lại. */
  async refundBooking(bookingId: number): Promise<RefundStatus> {
    const due = await this.prisma.payments.findMany({
      where: {
        booking_id: bookingId,
        status: 'success',
        raw_response: { path: ['needs_refund'], equals: true },
      },
      select: { id: true },
    });

    if (due.length === 0) {
      return 'none';
    }

    let allRefunded = true;

    for (const { id } of due) {
      if ((await this.refundPayment(id)) !== 'refunded') {
        allRefunded = false;
      }
    }

    return allRefunded ? 'refunded' : 'pending';
  }

  private async retryRefunds() {
    const now = Date.now();
    const due = await this.prisma.payments.findMany({
      where: {
        status: 'success',
        raw_response: { path: ['needs_refund'], equals: true },
      },
      orderBy: { id: 'asc' },
      take: RECONCILE_BATCH_SIZE,
    });

    for (const payment of due) {
      const { attempts, lastAttemptAt } = this.refundProgress(payment);

      if (
        attempts < MAX_REFUND_ATTEMPTS &&
        (lastAttemptAt === null ||
          lastAttemptAt + REFUND_RETRY_MINUTES * 60_000 <= now)
      ) {
        await this.refundPayment(payment.id);
      }
    }
  }

  private refundProgress(payment: PaymentRecord) {
    const refund = asObject(asObject(payment.raw_response).refund ?? null);
    const lastAttemptAt = Date.parse(asString(refund.last_attempt_at));

    return {
      attempts: Number(refund.attempts ?? 0),
      lastAttemptAt: Number.isNaN(lastAttemptAt) ? null : lastAttemptAt,
    };
  }

  /**
   * Hoàn toàn phần một payment đã thu. Không bao giờ throw: lỗi được ghi vào raw_response.refund
   * để cron thử lại (tối đa MAX_REFUND_ATTEMPTS lần, sau đó cần xử lý tay).
   */
  private async refundPayment(
    paymentId: number,
  ): Promise<'refunded' | 'pending'> {
    // Chặn hai luồng (IPN trễ + cron) cùng hoàn một khoản; refundRef cố định là lớp chặn thứ hai ở phía cổng.
    if (this.refunding.has(paymentId)) {
      return 'pending';
    }

    this.refunding.add(paymentId);

    try {
      const payment = await this.prisma.payments.findUnique({
        where: { id: paymentId },
      });

      if (!payment || payment.status !== 'success') {
        return payment?.status === 'refunded' ? 'refunded' : 'pending';
      }

      const raw = asObject(payment.raw_response);
      const { attempts } = this.refundProgress(payment);

      try {
        const txn = this.resolveTxn(payment);

        if (!txn || !isOnlinePaymentMethod(payment.method)) {
          throw new Error(
            `payment method "${payment.method}" cannot be refunded automatically`,
          );
        }

        const refunded = await this.gateways[payment.method].refund({
          refundRef: `R${payment.id}`,
          txnRef: txn.txnRef,
          createdAt: txn.createdAt,
          amount: payment.amount.toNumber(),
          providerTransactionId: payment.provider_transaction_id,
          reason: 'Hoan tien huy don',
        });

        await this.prisma.payments.updateMany({
          where: { id: payment.id, status: 'success' },
          data: {
            status: 'refunded',
            refunded_at: new Date(),
            raw_response: {
              ...raw,
              needs_refund: false,
              refund: { attempts: attempts + 1, response: refunded.raw },
            } as Prisma.InputJsonObject,
          },
        });

        return 'refunded';
      } catch (error) {
        const message = errorMessage(error);

        await this.prisma.payments.updateMany({
          where: { id: payment.id, status: 'success' },
          data: {
            raw_response: {
              ...raw,
              refund: {
                attempts: attempts + 1,
                last_error: message,
                last_attempt_at: new Date().toISOString(),
              },
            } as Prisma.InputJsonObject,
          },
        });

        const exhausted = attempts + 1 >= MAX_REFUND_ATTEMPTS;

        this.logger.error(
          `Refund of payment ${payment.id} failed (attempt ${attempts + 1}/${MAX_REFUND_ATTEMPTS}): ${message}` +
            (exhausted ? ' - giving up, refund manually' : ''),
        );

        return 'pending';
      }
    } catch (error) {
      this.logger.error(
        `Could not process refund of payment ${paymentId}: ${errorMessage(error)}`,
      );

      return 'pending';
    } finally {
      this.refunding.delete(paymentId);
    }
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
      this.parseTxnRef(result.txnRef)?.paymentId ?? null,
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
        refunded_at: true,
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
