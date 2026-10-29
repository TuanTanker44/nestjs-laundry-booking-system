import { computeLegFee } from './delivery-fee.util.js';

describe('computeLegFee', () => {
  it('charges only the base fee within the free distance', () => {
    expect(computeLegFee(0)).toBe(15000);
    expect(computeLegFee(3)).toBe(15000);
  });

  it('adds the per-km fee beyond the free distance, rounded up to 1000', () => {
    expect(computeLegFee(4)).toBe(20000);
    expect(computeLegFee(3.1)).toBe(16000);
    expect(computeLegFee(6.89)).toBe(35000);
  });

  it('is monotonic with distance', () => {
    expect(computeLegFee(10)).toBeGreaterThan(computeLegFee(5));
  });
});
