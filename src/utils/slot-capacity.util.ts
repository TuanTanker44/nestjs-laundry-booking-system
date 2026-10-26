import type { Prisma } from '../generated/prisma/client.js';

// Đơn pending_payment giữ chỗ slot tối đa bấy nhiêu phút kể từ lúc tạo.
export const PENDING_PAYMENT_HOLD_MINUTES = 15;

/** Mốc thời gian: đơn pending_payment tạo trước mốc này đã hết hạn giữ chỗ. */
export function pendingHoldCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - PENDING_PAYMENT_HOLD_MINUTES * 60_000);
}

/**
 * Điều kiện các booking đang chiếm chỗ của slot: bỏ đơn đã hủy / no_show
 * và đơn chờ thanh toán đã quá thời gian giữ chỗ.
 * Dùng chung cho API xem slot trống và lúc tạo booking để hai nơi luôn khớp nhau.
 */
export function slotBlockingWhere(
  now: Date = new Date(),
): Prisma.bookingsWhereInput {
  return {
    status: { notIn: ['cancelled', 'no_show'] },
    NOT: {
      status: 'pending_payment',
      created_at: { lt: pendingHoldCutoff(now) },
    },
  };
}
