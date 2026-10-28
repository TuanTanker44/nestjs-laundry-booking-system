import { Decimal } from '@prisma/client/runtime/client';

import { PaymentService } from './payment.service.js';
import type { GatewayQueryResult } from './payment.types.js';

const NOW = new Date('2026-10-28T10:00:00.000Z');
const TXN_CREATED_AT = new Date('2026-10-28T09:40:00.000Z');
const TXN_REF = `P7T${TXN_CREATED_AT.getTime() / 1000}`;

function makePayment(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    booking_id: 3,
    payment_type: 'full',
    amount: new Decimal(50000),
    method: 'vnpay',
    provider_transaction_id: null,
    txn_ref: TXN_REF,
    payment_url: 'https://pay.test/7',
    qr_code_url: null,
    expires_at: new Date('2026-10-28T09:55:00.000Z'),
    status: 'pending',
    paid_at: null,
    refunded_at: null,
    raw_response: null,
    created_at: TXN_CREATED_AT,
    updated_at: TXN_CREATED_AT,
    ...overrides,
  };
}

function setup() {
  const prisma = {
    payments: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn(),
    },
    bookings: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  };

  prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
    fn(prisma),
  );

  const gateway = {
    method: 'vnpay' as const,
    createPayment: vi.fn(),
    verifyCallback: vi.fn(),
    queryTransaction: vi.fn(),
    refund: vi.fn().mockResolvedValue({ raw: { vnp_ResponseCode: '00' } }),
  };

  const service = new PaymentService(
    prisma as never,
    { get: vi.fn() } as never,
    {} as never,
    gateway as never,
    { ...gateway, method: 'momo' } as never,
  );

  return { service, prisma, gateway };
}

function ipn(gateway: ReturnType<typeof setup>['gateway'], success = true) {
  gateway.verifyCallback.mockReturnValue({
    validSignature: true,
    txnRef: TXN_REF,
    amount: 50000,
    success,
    providerTransactionId: 'VNP123',
    raw: { vnp_TxnRef: TXN_REF },
  });
}

describe('PaymentService', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('handleIpn', () => {
    it('xác nhận đơn khi thanh toán thành công trong thời gian giữ chỗ', async () => {
      const { service, prisma, gateway } = setup();

      ipn(gateway);
      prisma.payments.findUnique.mockResolvedValue(makePayment());
      prisma.bookings.updateMany.mockResolvedValue({ count: 1 });

      await expect(service.handleIpn('vnpay', {})).resolves.toBe('ok');
      expect(prisma.bookings.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'confirmed' } }),
      );
      expect(gateway.refund).not.toHaveBeenCalled();
    });

    it('giao dịch đã failed (hết hạn / bị thay phiên) nhưng tiền về trễ: ghi nhận và tự hoàn', async () => {
      const { service, prisma, gateway } = setup();

      ipn(gateway);
      prisma.payments.findUnique
        // handleIpn đọc giao dịch (đã failed)...
        .mockResolvedValueOnce(makePayment({ status: 'failed' }))
        // ...refundPayment đọc lại sau khi đã ghi nhận success.
        .mockResolvedValueOnce(
          makePayment({
            status: 'success',
            provider_transaction_id: 'VNP123',
            raw_response: { needs_refund: true },
          }),
        );
      prisma.bookings.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.handleIpn('vnpay', {})).resolves.toBe('ok');

      expect(prisma.payments.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 7, status: { in: ['pending', 'failed'] } },
        }),
      );
      expect(prisma.payments.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { raw_response: expect.objectContaining({ needs_refund: true }) },
        }),
      );

      await vi.waitFor(() => expect(gateway.refund).toHaveBeenCalledTimes(1));
      expect(gateway.refund).toHaveBeenCalledWith(
        expect.objectContaining({
          refundRef: 'R7',
          txnRef: TXN_REF,
          createdAt: TXN_CREATED_AT,
          amount: 50000,
          providerTransactionId: 'VNP123',
        }),
      );
    });

    it('IPN lặp lại cho giao dịch đã success không xử lý lần hai', async () => {
      const { service, prisma, gateway } = setup();

      ipn(gateway);
      prisma.payments.findUnique.mockResolvedValue(
        makePayment({ status: 'success' }),
      );
      prisma.payments.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.handleIpn('vnpay', {})).resolves.toBe(
        'already_confirmed',
      );
      expect(prisma.bookings.updateMany).not.toHaveBeenCalled();
    });

    it('từ chối khi số tiền không khớp DB', async () => {
      const { service, prisma, gateway } = setup();

      ipn(gateway);
      prisma.payments.findUnique.mockResolvedValue(
        makePayment({ amount: new Decimal(60000) }),
      );

      await expect(service.handleIpn('vnpay', {})).resolves.toBe(
        'invalid_amount',
      );
    });
  });

  describe('sweep', () => {
    const unpaid: GatewayQueryResult = {
      state: 'unpaid',
      amount: 0,
      providerTransactionId: null,
      raw: {},
    };

    it('đánh failed giao dịch pending đã quá hạn (kèm thời gian chờ IPN) mà cổng báo chưa trả', async () => {
      const { service, prisma, gateway } = setup();

      prisma.payments.findMany.mockResolvedValue([makePayment()]);
      gateway.queryTransaction.mockResolvedValue(unpaid);

      await service.sweep();

      expect(gateway.queryTransaction).toHaveBeenCalledWith({
        txnRef: TXN_REF,
        createdAt: TXN_CREATED_AT,
      });
      expect(prisma.payments.updateMany).toHaveBeenCalledWith({
        where: { id: 7, status: 'pending' },
        data: { status: 'failed' },
      });
    });

    it('giữ nguyên giao dịch chưa quá hạn mà cổng báo chưa trả', async () => {
      const { service, prisma, gateway } = setup();

      prisma.payments.findMany.mockResolvedValue([
        makePayment({ expires_at: new Date('2026-10-28T10:10:00.000Z') }),
      ]);
      gateway.queryTransaction.mockResolvedValue(unpaid);

      await service.sweep();

      expect(prisma.payments.updateMany).not.toHaveBeenCalled();
    });

    it('cổng báo đã thu tiền (IPN bị mất): ghi nhận success và xác nhận đơn', async () => {
      const { service, prisma, gateway } = setup();

      prisma.payments.findMany.mockResolvedValue([
        makePayment({ expires_at: new Date('2026-10-28T10:10:00.000Z') }),
      ]);
      gateway.queryTransaction.mockResolvedValue({
        state: 'paid',
        amount: 50000,
        providerTransactionId: 'VNP123',
        raw: { vnp_TransactionStatus: '00' },
      });
      prisma.bookings.updateMany.mockResolvedValue({ count: 1 });

      await service.sweep();

      expect(prisma.bookings.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'confirmed' } }),
      );
    });

    it('không hỏi được cổng thì chưa đóng giao dịch quá hạn (có thể khách đã trả)', async () => {
      const { service, prisma, gateway } = setup();

      prisma.payments.findMany.mockResolvedValue([makePayment()]);
      gateway.queryTransaction.mockRejectedValue(new Error('timeout'));

      await service.sweep();

      expect(prisma.payments.updateMany).not.toHaveBeenCalled();
    });

    it('không hỏi được cổng quá lâu sau khi hết hạn thì bỏ cuộc và đóng giao dịch', async () => {
      const { service, prisma, gateway } = setup();

      prisma.payments.findMany.mockResolvedValue([
        makePayment({ expires_at: new Date('2026-10-28T08:00:00.000Z') }),
      ]);
      gateway.queryTransaction.mockRejectedValue(new Error('timeout'));

      await service.sweep();

      expect(prisma.payments.updateMany).toHaveBeenCalledWith({
        where: { id: 7, status: 'pending' },
        data: { status: 'failed' },
      });
    });
  });

  describe('refundBooking', () => {
    const paid = makePayment({
      status: 'success',
      provider_transaction_id: 'VNP123',
      raw_response: { needs_refund: true },
    });

    it('không có khoản nào cần hoàn thì trả none', async () => {
      const { service, prisma } = setup();

      prisma.payments.findMany.mockResolvedValue([]);

      await expect(service.refundBooking(3)).resolves.toBe('none');
    });

    it('hoàn thành công: đánh dấu refunded và bỏ cờ needs_refund', async () => {
      const { service, prisma, gateway } = setup();

      prisma.payments.findMany.mockResolvedValue([{ id: 7 }]);
      prisma.payments.findUnique.mockResolvedValue(paid);

      await expect(service.refundBooking(3)).resolves.toBe('refunded');

      expect(gateway.refund).toHaveBeenCalledTimes(1);
      expect(prisma.payments.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 7, status: 'success' },
          data: expect.objectContaining({
            status: 'refunded',
            refunded_at: NOW,
            raw_response: expect.objectContaining({ needs_refund: false }),
          }),
        }),
      );
    });

    it('cổng lỗi: giữ nguyên success, ghi lại lần thử để cron thử lại', async () => {
      const { service, prisma, gateway } = setup();

      prisma.payments.findMany.mockResolvedValue([{ id: 7 }]);
      prisma.payments.findUnique.mockResolvedValue(paid);
      gateway.refund.mockRejectedValue(new Error('gateway down'));

      await expect(service.refundBooking(3)).resolves.toBe('pending');

      const [{ data }] = prisma.payments.updateMany.mock.calls[0] as [
        { data: { status?: string; raw_response: Record<string, unknown> } },
      ];

      expect(data.status).toBeUndefined();
      expect(data.raw_response).toMatchObject({
        needs_refund: true,
        refund: { attempts: 1, last_error: 'gateway down' },
      });
    });

    it('cron không thử lại khoản đã hết số lần hoặc mới thử gần đây', async () => {
      const { service, prisma, gateway } = setup();
      const failed = (attempts: number, lastAttemptAt: string) =>
        makePayment({
          status: 'success',
          raw_response: {
            needs_refund: true,
            refund: { attempts, last_attempt_at: lastAttemptAt },
          },
        });

      prisma.payments.findMany
        .mockResolvedValueOnce([]) // reconcilePending
        .mockResolvedValueOnce([
          { ...failed(5, '2026-10-28T08:00:00.000Z'), id: 1 }, // hết số lần
          { ...failed(1, '2026-10-28T09:58:00.000Z'), id: 2 }, // mới thử 2 phút trước
        ]);

      await service.sweep();

      expect(gateway.refund).not.toHaveBeenCalled();
    });
  });

  describe('onBookingCancelled', () => {
    it('đóng phiên chờ; chỉ đánh dấu cần hoàn khi refund = true', async () => {
      const { service, prisma } = setup();

      prisma.payments.findMany.mockResolvedValue([
        makePayment({ status: 'success', raw_response: { vnp_TxnRef: 'x' } }),
      ]);

      await service.onBookingCancelled(prisma as never, 3, false);

      expect(prisma.payments.updateMany).toHaveBeenCalledWith({
        where: { booking_id: 3, status: 'pending' },
        data: { status: 'failed' },
      });
      expect(prisma.payments.update).not.toHaveBeenCalled();

      await service.onBookingCancelled(prisma as never, 3, true);

      expect(prisma.payments.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: {
          raw_response: { vnp_TxnRef: 'x', needs_refund: true },
        },
      });
    });
  });
});
