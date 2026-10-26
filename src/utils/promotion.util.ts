import type { promotions_discount_type_enum } from '../generated/prisma/client.js';

/** Làm tròn 2 chữ số thập phân (khớp Decimal(10,2)). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Số tiền được giảm cho một mã. Luôn nằm trong [0, subtotal] để đơn không âm.
 * `percent`: value là % (0-100); `fixed`: value là số tiền cố định.
 */
export function computeDiscount(
  type: promotions_discount_type_enum,
  value: number,
  subtotal: number,
): number {
  const raw = type === 'percent' ? (subtotal * value) / 100 : value;

  return round2(Math.min(Math.max(raw, 0), subtotal));
}
