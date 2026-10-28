import { createHmac, randomUUID } from 'node:crypto';

import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  asString,
  safeEqualHex,
  type CreateGatewayPaymentParams,
  type GatewayCallbackResult,
  type GatewayPaymentLink,
  type GatewayQueryResult,
  type GatewayRefundResult,
  type PaymentGateway,
  type QueryTransactionParams,
  type RefundParams,
} from '../payment.types.js';

const DEFAULT_VNPAY_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
// API truy vấn / hoàn tiền (server gọi server), khác với trang thanh toán của khách.
const DEFAULT_VNPAY_API_URL =
  'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';
const REQUEST_TIMEOUT_MS = 10_000;
const API_VERSION = '2.1.0';
const SERVER_IP = '127.0.0.1';
// vnp_ResponseCode của API truy vấn / hoàn tiền.
const RESPONSE_OK = '00';
const RESPONSE_NOT_FOUND = '91';
// Yêu cầu hoàn tiền này đã được gửi trước đó: coi như đã hoàn (gửi lại không hoàn hai lần).
const RESPONSE_REFUND_ALREADY_SENT = '94';
// VNPay yêu cầu giờ Việt Nam (GMT+7) cho vnp_CreateDate / vnp_ExpireDate.
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** yyyyMMddHHmmss theo giờ Việt Nam. */
function formatVnpDate(date: Date): string {
  return new Date(date.getTime() + VN_OFFSET_MS)
    .toISOString()
    .replace(/[-:T]/g, '')
    .slice(0, 14);
}

function encode(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, '+');
}

/** Chuỗi query đã sắp xếp theo key; chính chuỗi này cũng là dữ liệu để ký. */
function toSignedQuery(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((key) => `${encode(key)}=${encode(params[key])}`)
    .join('&');
}

@Injectable()
export class VnpayService implements PaymentGateway {
  readonly method = 'vnpay' as const;

  constructor(private readonly config: ConfigService) {}

  private required(key: string): string {
    const value = this.config.get<string>(key);

    if (!value) {
      throw new ServiceUnavailableException('VNPay is not configured');
    }

    return value;
  }

  private sign(data: string): string {
    return createHmac('sha512', this.required('VNPAY_HASH_SECRET'))
      .update(Buffer.from(data, 'utf-8'))
      .digest('hex');
  }

  /** Gọi API server-to-server của VNPay. Phản hồi đi qua HTTPS tới endpoint cấu hình nên không kiểm tra lại chữ ký. */
  private async callApi(body: Record<string, string>) {
    try {
      const response = await fetch(
        this.config.get<string>('VNPAY_API_URL') ?? DEFAULT_VNPAY_API_URL,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );

      return (await response.json()) as Record<string, string | undefined>;
    } catch {
      throw new BadGatewayException('Could not reach VNPay');
    }
  }

  createPayment(
    params: CreateGatewayPaymentParams,
  ): Promise<GatewayPaymentLink> {
    const query: Record<string, string> = {
      vnp_Version: API_VERSION,
      vnp_Command: 'pay',
      vnp_TmnCode: this.required('VNPAY_TMN_CODE'),
      // VNPay quy định gửi số tiền nhân 100.
      vnp_Amount: String(params.amount * 100),
      vnp_CreateDate: formatVnpDate(params.createdAt),
      vnp_ExpireDate: formatVnpDate(params.expireAt),
      vnp_CurrCode: 'VND',
      vnp_IpAddr: params.clientIp,
      vnp_Locale: 'vn',
      vnp_OrderInfo: params.orderInfo,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: this.required('VNPAY_RETURN_URL'),
      vnp_TxnRef: params.txnRef,
    };

    const signed = toSignedQuery(query);
    const baseUrl = this.config.get<string>('VNPAY_URL') ?? DEFAULT_VNPAY_URL;

    return Promise.resolve({
      paymentUrl: `${baseUrl}?${signed}&vnp_SecureHash=${this.sign(signed)}`,
    });
  }

  verifyCallback(payload: Record<string, unknown>): GatewayCallbackResult {
    const params: Record<string, string> = {};

    for (const [key, value] of Object.entries(payload)) {
      if (
        key.startsWith('vnp_') &&
        key !== 'vnp_SecureHash' &&
        key !== 'vnp_SecureHashType' &&
        typeof value === 'string'
      ) {
        params[key] = value;
      }
    }

    const received = asString(payload.vnp_SecureHash);
    const expected = this.sign(toSignedQuery(params));

    return {
      validSignature: safeEqualHex(received, expected),
      txnRef: params.vnp_TxnRef ?? '',
      amount: Number(params.vnp_Amount ?? 0) / 100,
      success:
        params.vnp_ResponseCode === '00' &&
        params.vnp_TransactionStatus === '00',
      providerTransactionId: params.vnp_TransactionNo ?? null,
      raw: { ...params },
    };
  }

  async queryTransaction(
    params: QueryTransactionParams,
  ): Promise<GatewayQueryResult> {
    const tmnCode = this.required('VNPAY_TMN_CODE');
    const requestId = randomUUID().replace(/-/g, '');
    const createDate = formatVnpDate(new Date());
    const transactionDate = formatVnpDate(params.createdAt);
    const orderInfo = `Truy van giao dich ${params.txnRef}`;

    // Chuỗi ký của VNPay nối các trường theo thứ tự cố định bằng dấu '|'.
    const secureHash = this.sign(
      [
        requestId,
        API_VERSION,
        'querydr',
        tmnCode,
        params.txnRef,
        transactionDate,
        createDate,
        SERVER_IP,
        orderInfo,
      ].join('|'),
    );

    const data = await this.callApi({
      vnp_RequestId: requestId,
      vnp_Version: API_VERSION,
      vnp_Command: 'querydr',
      vnp_TmnCode: tmnCode,
      vnp_TxnRef: params.txnRef,
      vnp_OrderInfo: orderInfo,
      vnp_TransactionDate: transactionDate,
      vnp_CreateDate: createDate,
      vnp_IpAddr: SERVER_IP,
      vnp_SecureHash: secureHash,
    });

    const base = {
      amount: Number(data.vnp_Amount ?? 0) / 100,
      providerTransactionId: data.vnp_TransactionNo ?? null,
      raw: { ...data },
    };

    // Khách chưa từng vào trang thanh toán nên VNPay không có giao dịch.
    if (data.vnp_ResponseCode === RESPONSE_NOT_FOUND) {
      return { ...base, state: 'unpaid' };
    }

    if (data.vnp_ResponseCode !== RESPONSE_OK) {
      throw new BadGatewayException(
        `VNPay query failed: ${data.vnp_ResponseCode ?? ''} ${data.vnp_Message ?? ''}`,
      );
    }

    // vnp_TransactionStatus: 00 thành công, 02 lỗi, các mã khác (01 chưa xong, 0x hoàn / đảo...) coi như chưa có kết quả.
    const state =
      data.vnp_TransactionStatus === '00'
        ? 'paid'
        : data.vnp_TransactionStatus === '02'
          ? 'failed'
          : 'unpaid';

    return { ...base, state };
  }

  async refund(params: RefundParams): Promise<GatewayRefundResult> {
    const tmnCode = this.required('VNPAY_TMN_CODE');
    const createDate = formatVnpDate(new Date());
    const transactionDate = formatVnpDate(params.createdAt);
    const transactionNo = params.providerTransactionId ?? '';
    const amount = String(params.amount * 100);
    const createBy = 'system';
    // 02 = hoàn toàn phần.
    const transactionType = '02';

    const secureHash = this.sign(
      [
        params.refundRef,
        API_VERSION,
        'refund',
        tmnCode,
        transactionType,
        params.txnRef,
        amount,
        transactionNo,
        transactionDate,
        createBy,
        createDate,
        SERVER_IP,
        params.reason,
      ].join('|'),
    );

    const data = await this.callApi({
      vnp_RequestId: params.refundRef,
      vnp_Version: API_VERSION,
      vnp_Command: 'refund',
      vnp_TmnCode: tmnCode,
      vnp_TransactionType: transactionType,
      vnp_TxnRef: params.txnRef,
      vnp_Amount: amount,
      vnp_OrderInfo: params.reason,
      vnp_TransactionNo: transactionNo,
      vnp_TransactionDate: transactionDate,
      vnp_CreateBy: createBy,
      vnp_CreateDate: createDate,
      vnp_IpAddr: SERVER_IP,
      vnp_SecureHash: secureHash,
    });

    if (
      data.vnp_ResponseCode !== RESPONSE_OK &&
      data.vnp_ResponseCode !== RESPONSE_REFUND_ALREADY_SENT
    ) {
      throw new BadGatewayException(
        `VNPay refund failed: ${data.vnp_ResponseCode ?? ''} ${data.vnp_Message ?? ''}`,
      );
    }

    return { raw: { ...data } };
  }
}
