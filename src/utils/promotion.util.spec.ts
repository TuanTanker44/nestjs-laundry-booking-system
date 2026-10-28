import { computeDiscount, round2 } from './promotion.util.js';

describe('promotion.util', () => {
  describe('round2', () => {
    it.each([
      [10.004, 10],
      [10.005, 10.01],
      [10.999, 11],
      [-1.234, -1.23],
    ])('rounds %s to %s', (input, expected) => {
      expect(round2(input)).toBe(expected);
    });
  });

  describe('computeDiscount', () => {
    it('calculates percent discount', () => {
      expect(computeDiscount('percent', 15, 200000)).toBe(30000);
    });

    it('calculates fixed discount', () => {
      expect(computeDiscount('fixed', 25000, 200000)).toBe(25000);
    });

    it('does not allow a negative discount', () => {
      expect(computeDiscount('fixed', -100, 200000)).toBe(0);
      expect(computeDiscount('percent', -10, 200000)).toBe(0);
    });

    it('caps discount at subtotal', () => {
      expect(computeDiscount('fixed', 300000, 200000)).toBe(200000);
      expect(computeDiscount('percent', 150, 200000)).toBe(200000);
    });

    it('rounds percent discount to two decimals', () => {
      expect(computeDiscount('percent', 12.345, 99.99)).toBe(12.34);
    });
  });
});
