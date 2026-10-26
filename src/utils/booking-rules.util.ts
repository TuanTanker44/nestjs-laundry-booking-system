/**
 * Các quy tắc nghiệp vụ của booking dưới dạng hàm thuần (không phụ thuộc
 * DB/Nest) để dễ viết unit test.
 *
 * Mọi mốc thời gian theo quy ước "giờ cửa hàng" (xem schedule-time.util.ts).
 */
import { randomInt } from 'node:crypto';

import type {
  bookings_status_enum,
  services_pricing_unit_enum,
} from '../generated/prisma/client.js';
import { round2 } from './promotion.util.js';

// Chỉ cho đặt lịch trước tối đa bấy nhiêu ngày.
export const MAX_ADVANCE_DAYS = 7;
// Mỗi khách tối đa bấy nhiêu đơn đang chờ thanh toán (còn hạn giữ chỗ).
export const MAX_PENDING_BOOKINGS = 5;
// Khách hủy trước giờ lấy ít nhất bấy nhiêu giờ thì được hoàn 100%.
export const FREE_CANCEL_HOURS = 2;

/** Các trạng thái khách / nhân viên còn được phép hủy đơn. */
export const CANCELLABLE_STATUSES: bookings_status_enum[] = [
  'pending_payment',
  'confirmed',
];

/**
 * Các trạng thái kế tiếp hợp lệ. Đơn tại cửa hàng (in_store) bỏ qua bước
 * lấy đồ / giao trả vì khách tự mang đến và tự nhận.
 */
export function nextStatuses(
  status: bookings_status_enum,
  inStore: boolean,
): bookings_status_enum[] {
  switch (status) {
    case 'pending_payment':
      return ['confirmed', 'cancelled'];
    case 'confirmed':
      return inStore
        ? ['processing', 'cancelled', 'no_show']
        : ['picked_up', 'cancelled', 'no_show'];
    case 'picked_up':
      return ['processing'];
    case 'processing':
      return inStore ? ['completed'] : ['ready_for_delivery'];
    case 'ready_for_delivery':
      return ['delivering'];
    case 'delivering':
      return ['completed'];
    default:
      return [];
  }
}

/** Tiền dịch vụ trước giảm giá. per_kg: theo cân nặng, per_item: theo tổng số món. */
export function computeSubtotal(
  pricingUnit: services_pricing_unit_enum,
  unitPrice: number,
  input: { weightKg?: number | null; itemQuantities?: number[] },
): number {
  const quantity =
    pricingUnit === 'per_kg'
      ? (input.weightKg ?? 0)
      : (input.itemQuantities ?? []).reduce((sum, item) => sum + item, 0);

  return round2(quantity * unitPrice);
}

/** Tổng phải trả = (tiền dịch vụ - giảm giá, tối thiểu 0) + phí giao nếu có. */
export function computeTotal(
  subtotal: number,
  discount: number,
  deliveryPrice: number | null = null,
): number {
  return round2(Math.max(subtotal - discount, 0) + (deliveryPrice ?? 0));
}

/**
 * Phần trăm hoàn tiền khi hủy đơn.
 * - Đơn chưa thanh toán: không có gì để hoàn (0).
 * - Cửa hàng / admin hủy: hoàn 100%.
 * - Khách hủy: hoàn 100% nếu còn đủ FREE_CANCEL_HOURS trước giờ lấy, ngược lại 0%.
 */
export function refundPercent(params: {
  status: bookings_status_enum;
  pickupStart: Date;
  now: Date;
  cancelledByCustomer: boolean;
}): number {
  if (params.status === 'pending_payment') {
    return 0;
  }

  if (!params.cancelledByCustomer) {
    return 100;
  }

  const hoursLeft = (params.pickupStart.getTime() - params.now.getTime()) / 3_600_000;

  return hoursLeft >= FREE_CANCEL_HOURS ? 100 : 0;
}

// Bỏ các ký tự dễ nhầm (0/O, 1/I) để mã đọc qua điện thoại không bị sai.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Mã đơn dạng LD260101-A7K2 (ngày theo giờ cửa hàng + 4 ký tự ngẫu nhiên). */
export function generateBookingCode(storeToday: Date): string {
  const yy = String(storeToday.getUTCFullYear()).slice(2);
  const mm = String(storeToday.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(storeToday.getUTCDate()).padStart(2, '0');
  let suffix = '';

  for (let i = 0; i < 4; i += 1) {
    suffix += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }

  return `LD${yy}${mm}${dd}-${suffix}`;
}
