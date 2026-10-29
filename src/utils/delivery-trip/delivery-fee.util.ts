// Quy tắc phí giao: mỗi lượt (cửa hàng <-> địa chỉ khách) tính riêng.
export const DELIVERY_BASE_FEE = 15_000;
export const DELIVERY_FREE_KM = 3;
export const DELIVERY_FEE_PER_KM = 5_000;
export const DELIVERY_ROUND_TO = 1_000;
// Xa hơn mức này cửa hàng không nhận đơn giao tận nơi.
export const DELIVERY_MAX_KM = 15;
// Khi dịch vụ đường đi lỗi, ước lượng đường bộ = đường chim bay nhân hệ số này.
export const DELIVERY_FALLBACK_FACTOR = 1.3;

/** Phí một lượt: phí cơ bản cho DELIVERY_FREE_KM đầu, phần vượt tính theo km và làm tròn lên. */
export function computeLegFee(distanceKm: number): number {
  const extraKm = Math.max(0, distanceKm - DELIVERY_FREE_KM);
  const extraFee =
    Math.ceil((extraKm * DELIVERY_FEE_PER_KM) / DELIVERY_ROUND_TO) *
    DELIVERY_ROUND_TO;

  return DELIVERY_BASE_FEE + extraFee;
}
