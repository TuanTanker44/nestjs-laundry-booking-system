/**
 * Các hàm thuần (không phụ thuộc DB/Nest) để xử lý giờ mở cửa và sinh slot,
 * dễ viết unit test.
 *
 * Quy ước múi giờ: các cột Timestamp/Time trong DB không có múi giờ nên mọi
 * giá trị được hiểu là GIỜ ĐỊA PHƯƠNG của cửa hàng và lưu "nguyên văn" vào
 * các trường UTC của Date (không quy đổi). Booking sau này cũng phải theo
 * quy ước này để so sánh slot cho đúng.
 */

export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Việt Nam: UTC+7. Dùng để biết "bây giờ" theo giờ cửa hàng.
export const STORE_UTC_OFFSET_MINUTES = 7 * 60;

export interface TimeSlot {
  start: string; // HH:mm
  end: string; // HH:mm
}

const pad = (value: number) => String(value).padStart(2, '0');

/** "08:30" -> 510 */
export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + minutes;
}

/** 510 -> "08:30" */
export function fromMinutes(totalMinutes: number): string {
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
}

/** "08:30" -> Date để ghi vào cột @db.Time */
export function timeToDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);

  return new Date(Date.UTC(1970, 0, 1, hours, minutes));
}

/** Date đọc từ cột @db.Time -> "08:30" */
export function dateToTime(date: Date): string {
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

/**
 * "2026-10-21" -> Date (00:00 UTC). Trả null nếu sai định dạng hoặc
 * ngày không tồn tại (vd. 2026-02-31).
 */
export function parseDateOnly(value: string): Date | null {
  if (!DATE_REGEX.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || formatDateOnly(date) !== value) {
    return null;
  }

  return date;
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Thời điểm hiện tại theo giờ cửa hàng (đặt trong các trường UTC). */
export function storeNow(now: Date = new Date()): Date {
  return new Date(now.getTime() + STORE_UTC_OFFSET_MINUTES * 60_000);
}

/**
 * Chia khoảng [open, close] thành các slot liên tiếp dài `slotMinutes`.
 * Slot cuối không đủ độ dài sẽ bị bỏ (không vượt quá giờ đóng cửa).
 */
export function generateSlots(
  open: string,
  close: string,
  slotMinutes: number,
): TimeSlot[] {
  if (slotMinutes <= 0) {
    return [];
  }

  const slots: TimeSlot[] = [];
  const closeMinutes = toMinutes(close);

  for (
    let start = toMinutes(open);
    start + slotMinutes <= closeMinutes;
    start += slotMinutes
  ) {
    slots.push({
      start: fromMinutes(start),
      end: fromMinutes(start + slotMinutes),
    });
  }

  return slots;
}
