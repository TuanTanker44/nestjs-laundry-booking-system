import { BadGatewayException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { vi } from 'vitest';
import { MapsService } from './maps.service.js';

const okResponse = (body: unknown) => ({ ok: true, json: vi.fn().mockResolvedValue(body) }) as any;
const badResponse = () => ({ ok: false, json: vi.fn() }) as any;

describe('MapsService', () => {
  const originalFetch = global.fetch;
  afterEach(() => { global.fetch = originalFetch; vi.restoreAllMocks(); });

  it('rejects an empty geocoding address', async () => {
    const service = new MapsService();
    await expect(service.geocodeAddress('   ')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('geocodes a valid address and parses coordinates', async () => {
    global.fetch = vi.fn().mockResolvedValue(okResponse([{ lat: '21.0285', lon: '105.8542' }]));
    const service = new MapsService();
    await expect(service.geocodeAddress('Hoan Kiem, Hanoi')).resolves.toEqual({ lat: 21.0285, lng: 105.8542 });
  });

  it('maps fetch failures to service unavailable', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('timeout'));
    await expect(new MapsService().geocodeAddress('Hanoi')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('maps upstream HTTP failures to bad gateway', async () => {
    global.fetch = vi.fn().mockResolvedValue(badResponse());
    await expect(new MapsService().geocodeAddress('Hanoi')).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('rejects empty geocoding result', async () => {
    global.fetch = vi.fn().mockResolvedValue(okResponse([]));
    await expect(new MapsService().geocodeAddress('unknown')).rejects.toThrow('Could not find this address');
  });

  it('reverse geocodes with the first successful provider', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(okResponse({ display_name: '123 ABC, Hanoi' }));
    await expect(new MapsService().reverseGeocode({ lat: 21, lng: 105 })).resolves.toBe('123 ABC, Hanoi');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('falls back from Nominatim to Photon', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(badResponse())
      .mockResolvedValueOnce(okResponse({ features: [{ properties: { housenumber: '12', street: 'ABC', district: 'D1', city: 'HCM', country: 'Vietnam' } }] }));
    await expect(new MapsService().reverseGeocode({ lat: 10, lng: 106 })).resolves.toBe('12 ABC, D1, HCM, Vietnam');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('computes a route from OSRM response', async () => {
    global.fetch = vi.fn().mockResolvedValue(okResponse({ code: 'Ok', routes: [{ distance: 1234, duration: 456 }] }));
    await expect(new MapsService().computeRoute({ lat: 10, lng: 106 }, { lat: 11, lng: 107 })).resolves.toEqual({ distanceMeters: 1234, durationSeconds: 456 });
  });

  it('rejects invalid coordinates before external request', async () => {
    global.fetch = vi.fn();
    await expect(new MapsService().computeRoute({ lat: 91, lng: 106 }, { lat: 10, lng: 106 })).rejects.toBeInstanceOf(BadRequestException);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects an OSRM response without a route', async () => {
    global.fetch = vi.fn().mockResolvedValue(okResponse({ code: 'Ok', routes: [] }));
    await expect(new MapsService().computeRoute({ lat: 10, lng: 106 }, { lat: 11, lng: 107 })).rejects.toThrow('No route found');
  });
});
