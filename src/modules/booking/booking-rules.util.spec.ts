import {
  computeSubtotal,
  computeTotal,
  generateBookingCode,
  nextStatuses,
  refundPercent,
} from '../../utils/booking-rules.util.js';
import { computeDiscount } from '../../utils/promotion.util.js';

describe('booking-rules.util', () => {
  describe('nextStatuses', () => {
    it('đơn giao nhận đi đủ các bước', () => {
      expect(nextStatuses('confirmed', false)).toContain('picked_up');
      expect(nextStatuses('picked_up', false)).toEqual(['processing']);
      expect(nextStatuses('processing', false)).toEqual(['ready_for_delivery']);
      expect(nextStatuses('ready_for_delivery', false)).toEqual(['delivering']);
      expect(nextStatuses('delivering', false)).toEqual(['completed']);
    });

    it('đơn tại cửa hàng bỏ qua bước lấy đồ và giao trả', () => {
      expect(nextStatuses('confirmed', true)).toContain('processing');
      expect(nextStatuses('confirmed', true)).not.toContain('picked_up');
      expect(nextStatuses('processing', true)).toEqual(['completed']);
    });

    it('trạng thái kết thúc không đi tiếp được', () => {
      expect(nextStatuses('completed', false)).toEqual([]);
      expect(nextStatuses('cancelled', true)).toEqual([]);
      expect(nextStatuses('no_show', true)).toEqual([]);
    });
  });

  describe('computeSubtotal / computeTotal', () => {
    it('tính theo kg', () => {
      expect(computeSubtotal('per_kg', 15000, { weightKg: 2.5 })).toBe(37500);
    });

    it('tính theo tổng số món', () => {
      expect(
        computeSubtotal('per_item', 20000, { itemQuantities: [2, 3] }),
      ).toBe(100000);
    });

    it('thiếu đầu vào thì bằng 0', () => {
      expect(computeSubtotal('per_kg', 15000, {})).toBe(0);
      expect(computeSubtotal('per_item', 15000, {})).toBe(0);
    });

    it('tổng không âm khi giảm giá lớn hơn tiền dịch vụ', () => {
      expect(computeTotal(50000, 80000)).toBe(0);
    });

    it('cộng phí giao khi có', () => {
      expect(computeTotal(100000, 20000, 15000)).toBe(95000);
      expect(computeTotal(100000, 20000, null)).toBe(80000);
    });
  });

  describe('computeDiscount', () => {
    it('giảm theo phần trăm', () => {
      expect(computeDiscount('percent', 10, 200000)).toBe(20000);
    });

    it('giảm số tiền cố định nhưng không vượt quá tiền dịch vụ', () => {
      expect(computeDiscount('fixed', 30000, 200000)).toBe(30000);
      expect(computeDiscount('fixed', 300000, 200000)).toBe(200000);
    });
  });

  describe('refundPercent', () => {
    const pickupStart = new Date('2026-11-01T10:00:00.000Z');
    const base = { status: 'confirmed' as const, pickupStart };

    it('khách hủy sớm (>= 2 giờ) được hoàn 100%', () => {
      const now = new Date('2026-11-01T08:00:00.000Z');

      expect(
        refundPercent({ ...base, now, cancelledByCustomer: true }),
      ).toBe(100);
    });

    it('khách hủy muộn hơn 2 giờ hoàn 0%', () => {
      const now = new Date('2026-11-01T08:01:00.000Z');

      expect(
        refundPercent({ ...base, now, cancelledByCustomer: true }),
      ).toBe(0);
    });

    it('cửa hàng hủy luôn hoàn 100%', () => {
      const now = new Date('2026-11-01T09:59:00.000Z');

      expect(
        refundPercent({ ...base, now, cancelledByCustomer: false }),
      ).toBe(100);
    });

    it('đơn chưa thanh toán không có gì để hoàn', () => {
      const now = new Date('2026-10-30T00:00:00.000Z');

      expect(
        refundPercent({
          status: 'pending_payment',
          pickupStart,
          now,
          cancelledByCustomer: true,
        }),
      ).toBe(0);
    });
  });

  describe('generateBookingCode', () => {
    it('có dạng LDyyMMdd-XXXX và vừa cột VarChar(20)', () => {
      const code = generateBookingCode(new Date('2026-11-05T00:00:00.000Z'));

      expect(code).toMatch(/^LD261105-[A-Z2-9]{4}$/);
      expect(code.length).toBeLessThanOrEqual(20);
    });
  });
});
