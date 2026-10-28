import { normalizeArea, parseAddress } from './address.util.js';

describe('address.util', () => {
  describe('normalizeArea', () => {
    it('removes Vietnamese administrative prefixes and accents', () => {
      expect(normalizeArea(' Thành phố Hồ Chí Minh ')).toBe('ho chi minh');
      expect(normalizeArea('Quận 1')).toBe('1');
      expect(normalizeArea('P. Bến Nghé')).toBe('ben nghe');
    });

    it('returns an empty string for empty input', () => {
      expect(normalizeArea(null)).toBe('');
      expect(normalizeArea(undefined)).toBe('');
      expect(normalizeArea('')).toBe('');
    });
  });

  describe('parseAddress', () => {
    it('extracts ward, district and city', () => {
      expect(
        parseAddress('123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh'),
      ).toEqual({ ward: 'Bến Nghé', district: '1', city: 'Hồ Chí Minh' });
    });

    it('supports abbreviated administrative prefixes', () => {
      expect(parseAddress('12 ABC, P. Bến Nghé, Q. 1, TP. Hồ Chí Minh')).toEqual({
        ward: 'Bến Nghé',
        district: '1',
        city: 'Hồ Chí Minh',
      });
    });

    it('recognizes a known city when it is the final segment without a prefix', () => {
      expect(parseAddress('123 ABC, Quận 1, Hồ Chí Minh').city).toBe('Hồ Chí Minh');
    });

    it('returns null for missing areas', () => {
      expect(parseAddress('123 ABC')).toEqual({ ward: null, district: null, city: null });
    });
  });
});
