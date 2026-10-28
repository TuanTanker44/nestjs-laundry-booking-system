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

const DEFAULT_MOMO_ENDPOINT =
  'https://test-payment.momo.vn/v2/gateway/api/create';
const REQUEST_TIMEOUT_MS = 10_000;

// resultCode của API truy vấn: giao dịch đã khởi tạo / đang xử lý (chưa có kết quả cuối).
const MOMO_PENDING_CODES = [1000, 7000, 7002, 9000];
// Không tìm thấy giao dịch (khách chưa mở trang thanh toán).
const MOMO_NOT_FOUND_CODE = 42;

interface MomoResponse {
  resultCode?: number;
  message?: string;
  payUrl?: string;
  qrCodeUrl?: string;
  transId?: number;
  amount?: number;
}

@Injectable()
export class MomoService implements PaymentGateway {
  readonly method = 'momo' as const;

  constructor(private readonly config: ConfigService) {}

  private required(key: string): string {
    const value = this.config.get<string>(key);

    if (!value) {
      throw new ServiceUnavailableException('MoMo is not configured');
    }

    return value;
  }

  private sign(data: string): string {
    return createHmac('sha256', this.required('MOMO_SECRET_KEY'))
      .update(data)
      .digest('hex');
  }

  private createEndpoint(): string {
    return this.config.get<string>('MOMO_ENDPOINT') ?? DEFAULT_MOMO_ENDPOINT;
  }

  /** API query / refund nằm cạnh API create nên suy ra từ cùng một cấu hình MOMO_ENDPOINT. */
  private async post(
    action: 'query' | 'refund',
    body: Record<string, unknown>,
  ): Promise<MomoResponse> {
    try {
      const response = await fetch(
        this.createEndpoint().replace(/\/create$/, `/${action}`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );

      return (await response.json()) as MomoResponse;
    } catch {
      throw new BadGatewayException('Could not reach MoMo');
    }
  }

  async createPayment(
    params: CreateGatewayPaymentParams,
  ): Promise<GatewayPaymentLink> {
    const partnerCode = this.required('MOMO_PARTNER_CODE');
    const accessKey = this.required('MOMO_ACCESS_KEY');
    const redirectUrl = this.required('MOMO_REDIRECT_URL');
    const ipnUrl = this.required('MOMO_IPN_URL');
    const requestType = 'captureWallet';
    const requestId = params.txnRef;
    const extraData = '';

    // Thứ tự key trong chuỗi ký do MoMo quy định (alphabet).
    const rawSignature =
      `accessKey=${accessKey}&amount=${params.amount}&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}&orderId=${params.txnRef}&orderInfo=${params.orderInfo}` +
      `&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}&requestType=${requestType}`;

    let data: MomoResponse;

    try {
      const response = await fetch(
        this.createEndpoint(),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partnerCode,
            requestId,
            amount: params.amount,
            orderId: params.txnRef,
            orderInfo: params.orderInfo,
            redirectUrl,
            ipnUrl,
            lang: 'vi',
            requestType,
            autoCapture: true,
            extraData,
            signature: this.sign(rawSignature),
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );

      data = (await response.json()) as MomoResponse;
    } catch {
      throw new BadGatewayException('Could not reach MoMo');
    }

    if (data.resultCode !== 0 || !data.payUrl) {
      throw new BadGatewayException(
        `MoMo rejected the payment request: ${data.message ?? 'unknown error'}`,
      );
    }

    return { paymentUrl: data.payUrl, qrCodeUrl: data.qrCodeUrl };
  }

  /** Dùng cho cả IPN (POST body) lẫn redirect (GET query): hai bên cùng tập field và chữ ký. */
  verifyCallback(payload: Record<string, unknown>): GatewayCallbackResult {
    const field = (key: string) => asString(payload[key]);

    const rawSignature =
      `accessKey=${this.required('MOMO_ACCESS_KEY')}&amount=${field('amount')}` +
      `&extraData=${field('extraData')}&message=${field('message')}` +
      `&orderId=${field('orderId')}&orderInfo=${field('orderInfo')}` +
      `&orderType=${field('orderType')}&partnerCode=${field('partnerCode')}` +
      `&payType=${field('payType')}&requestId=${field('requestId')}` +
      `&responseTime=${field('responseTime')}&resultCode=${field('resultCode')}` +
      `&transId=${field('transId')}`;

    return {
      validSignature: safeEqualHex(field('signature'), this.sign(rawSignature)),
      txnRef: field('orderId'),
      amount: Number(field('amount')),
      success: field('resultCode') === '0',
      providerTransactionId: field('transId') || null,
      raw: { ...payload },
    };
  }

  async queryTransaction(
    params: QueryTransactionParams,
  ): Promise<GatewayQueryResult> {
    const partnerCode = this.required('MOMO_PARTNER_CODE');
    const accessKey = this.required('MOMO_ACCESS_KEY');
    const requestId = randomUUID();

    const rawSignature =
      `accessKey=${accessKey}&orderId=${params.txnRef}` +
      `&partnerCode=${partnerCode}&requestId=${requestId}`;

    const data = await this.post('query', {
      partnerCode,
      requestId,
      orderId: params.txnRef,
      lang: 'vi',
      signature: this.sign(rawSignature),
    });

    const code = data.resultCode;
    const state =
      code === 0
        ? 'paid'
        : code === undefined ||
            code === MOMO_NOT_FOUND_CODE ||
            MOMO_PENDING_CODES.includes(code)
          ? 'unpaid'
          : 'failed';

    return {
      state,
      amount: Number(data.amount ?? 0),
      providerTransactionId: data.transId ? String(data.transId) : null,
      raw: { ...data },
    };
  }

  async refund(params: RefundParams): Promise<GatewayRefundResult> {
    const partnerCode = this.required('MOMO_PARTNER_CODE');
    const accessKey = this.required('MOMO_ACCESS_KEY');
    const transId = Number(params.providerTransactionId);

    if (!Number.isInteger(transId) || transId <= 0) {
      throw new BadGatewayException('MoMo refund needs the original transId');
    }

    // orderId / requestId của yêu cầu hoàn là refundRef cố định: gửi lại không hoàn hai lần.
    const rawSignature =
      `accessKey=${accessKey}&amount=${params.amount}&description=${params.reason}` +
      `&orderId=${params.refundRef}&partnerCode=${partnerCode}` +
      `&requestId=${params.refundRef}&transId=${transId}`;

    const data = await this.post('refund', {
      partnerCode,
      orderId: params.refundRef,
      requestId: params.refundRef,
      amount: params.amount,
      transId,
      lang: 'vi',
      description: params.reason,
      signature: this.sign(rawSignature),
    });

    if (data.resultCode !== 0) {
      throw new BadGatewayException(
        `MoMo refund failed: ${data.resultCode ?? ''} ${data.message ?? ''}`,
      );
    }

    return { raw: { ...data } };
  }
}
