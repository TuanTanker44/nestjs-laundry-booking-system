import {
  dateToTime,
  formatDateOnly,
  fromMinutes,
  generateSlots,
  parseDateOnly,
  storeNow,
  timeToDate,
  toMinutes,
} from './schedule-time.util.js';

describe('schedule-time.util', () => {
  describe('generateSlots', () => {
    it('chia đều khoảng mở cửa thành các slot', () => {
      expect(generateSlots('08:00', '11:00', 60)).toEqual([
        { start: '08:00', end: '09:00' },
        { start: '09:00', end: '10:00' },
        { start: '10:00', end: '11:00' },
      ]);
    });

    it('bỏ slot cuối nếu không đủ độ dài (không vượt giờ đóng cửa)', () => {
      expect(generateSlots('08:00', '10:30', 60)).toEqual([
        { start: '08:00', end: '09:00' },
        { start: '09:00', end: '10:00' },
      ]);
    });

    it('hỗ trợ slot 30 phút và giờ lẻ', () => {
      expect(generateSlots('08:30', '10:00', 30)).toEqual([
        { start: '08:30', end: '09:00' },
        { start: '09:00', end: '09:30' },
        { start: '09:30', end: '10:00' },
      ]);
    });

    it('trả về mảng rỗng khi slot dài hơn khoảng mở cửa hoặc slot <= 0', () => {
      expect(generateSlots('08:00', '08:30', 60)).toEqual([]);
      expect(generateSlots('08:00', '10:00', 0)).toEqual([]);
    });
  });

  describe('chuyển đổi giờ', () => {
    it('toMinutes / fromMinutes', () => {
      expect(toMinutes('08:30')).toBe(510);
      expect(fromMinutes(510)).toBe('08:30');
      expect(fromMinutes(0)).toBe('00:00');
    });

    it('timeToDate <-> dateToTime khứ hồi đúng', () => {
      expect(dateToTime(timeToDate('17:45'))).toBe('17:45');
    });
  });

  describe('parseDateOnly', () => {
    it('chấp nhận ngày hợp lệ', () => {
      const date = parseDateOnly('2026-10-21');

      expect(date).not.toBeNull();
      expect(formatDateOnly(date!)).toBe('2026-10-21');
      expect(date!.getUTCDay()).toBe(3); // thứ Tư
    });

    it('từ chối sai định dạng và ngày không tồn tại', () => {
      expect(parseDateOnly('21-10-2026')).toBeNull();
      expect(parseDateOnly('2026-02-31')).toBeNull();
      expect(parseDateOnly('2026-13-01')).toBeNull();
    });
  });

  describe('storeNow', () => {
    it('cộng 7 giờ so với UTC', () => {
      const utc = new Date('2026-10-21T20:00:00.000Z');

      expect(formatDateOnly(storeNow(utc))).toBe('2026-10-22');
      expect(dateToTime(storeNow(utc))).toBe('03:00');
    });
  });
});
