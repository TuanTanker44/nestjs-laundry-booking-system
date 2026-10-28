import { haversineKm } from './distance.util.js';

describe('distance.util', () => {
  it('returns zero for identical coordinates', () => {
    expect(haversineKm({ lat: 21.0285, lng: 105.8542 }, { lat: 21.0285, lng: 105.8542 })).toBe(0);
  });

  it('calculates a known approximate distance', () => {
    const distance = haversineKm(
      { lat: 21.0285, lng: 105.8542 },
      { lat: 10.8231, lng: 106.6297 },
    );

    expect(distance).toBeGreaterThan(1140);
    expect(distance).toBeLessThan(1160);
  });

  it('is symmetric', () => {
    const a = { lat: 16.0471, lng: 108.2068 };
    const b = { lat: 21.0285, lng: 105.8542 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 12);
  });
});
