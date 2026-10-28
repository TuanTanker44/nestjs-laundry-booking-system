import { timingSafeEqual } from 'node:crypto';

import type { payments_method_enum } from '../../generated/prisma/client.js';

/** Các phương thức thanh toán online đã có gateway (stripe / cash chưa hỗ trợ). */
export const ONLINE_PAYMENT_METHODS = ['vnpay', 'momo'] as const;

export type OnlinePaymentMethod = Extract<
  payments_method_enum,
  (typeof ONLINE_PAYMENT_METHODS)[number]
>;

export function isOnlinePaymentMethod(
  value: string,
): value is OnlinePaymentMethod {
  return (ONLINE_PAYMENT_METHODS as readonly string[]).includes(value);
}

/** Giá trị trong payload callback -> chuỗi; kiểu lạ (object, null...) coi như rỗng. */
export function asString(value: unknown): string {
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
    ? String(value)
    : '';
}

/** So sánh chữ ký hex không phân biệt hoa thường, chống timing attack. */
export function safeEqualHex(received: string, expected: string): boolean {
  const a = Buffer.from(received.toLowerCase(), 'utf-8');
  const b = Buffer.from(expected.toLowerCase(), 'utf-8');

  return a.length === b.length && timingSafeEqual(a, b);
}

export interface CreateGatewayPaymentParams {
  /** Mã giao dịch gửi cho cổng, duy nhất cho mỗi lần thử thanh toán. */
  txnRef: string;
  /** Số tiền VND, số nguyên. */
  amount: number;
  /** Nội dung thanh toán, không dấu. */
  orderInfo: string;
  /** Hết hạn thanh toán, trùng thời điểm hết hạn giữ chỗ của đơn. */
  expireAt: Date;
  clientIp: string;
}

export interface GatewayPaymentLink {
  paymentUrl: string;
  qrCodeUrl?: string;
}

/** Kết quả đọc một callback (IPN hoặc return URL) từ cổng thanh toán. */
export interface GatewayCallbackResult {
  /** Chữ ký hợp lệ. Nếu false, các trường còn lại không được tin. */
  validSignature: boolean;
  txnRef: string;
  /** Số tiền VND cổng báo đã thu. */
  amount: number;
  /** Cổng báo giao dịch thành công. */
  success: boolean;
  providerTransactionId: string | null;
  raw: Record<string, unknown>;
}

export interface PaymentGateway {
  readonly method: OnlinePaymentMethod;
  createPayment(params: CreateGatewayPaymentParams): Promise<GatewayPaymentLink>;
  verifyCallback(payload: Record<string, unknown>): GatewayCallbackResult;
}

export type CallbackOutcome =
  | 'ok'
  | 'invalid_signature'
  | 'not_found'
  | 'invalid_amount'
  | 'already_confirmed';
