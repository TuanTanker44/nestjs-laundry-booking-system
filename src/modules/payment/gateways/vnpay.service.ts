import { createHmac } from 'node:crypto';

import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  asString,
  safeEqualHex,
  type CreateGatewayPaymentParams,
  type GatewayCallbackResult,
  type GatewayPaymentLink,
  type PaymentGateway,
} from '../payment.types.js';

const DEFAULT_VNPAY_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
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

  createPayment(
    params: CreateGatewayPaymentParams,
  ): Promise<GatewayPaymentLink> {
    const query: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.required('VNPAY_TMN_CODE'),
      // VNPay quy định gửi số tiền nhân 100.
      vnp_Amount: String(params.amount * 100),
      vnp_CreateDate: formatVnpDate(new Date()),
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
}
