import { createHmac } from 'node:crypto';

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
  type PaymentGateway,
} from '../payment.types.js';

const DEFAULT_MOMO_ENDPOINT =
  'https://test-payment.momo.vn/v2/gateway/api/create';
const REQUEST_TIMEOUT_MS = 10_000;

interface MomoCreateResponse {
  resultCode?: number;
  message?: string;
  payUrl?: string;
  qrCodeUrl?: string;
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

    let data: MomoCreateResponse;

    try {
      const response = await fetch(
        this.config.get<string>('MOMO_ENDPOINT') ?? DEFAULT_MOMO_ENDPOINT,
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

      data = (await response.json()) as MomoCreateResponse;
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
}
