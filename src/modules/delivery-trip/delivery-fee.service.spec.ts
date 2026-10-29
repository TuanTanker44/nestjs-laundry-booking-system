import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { vi } from 'vitest';
import { DeliveryFeeService } from './delivery-fee.service.js';

function setup() {
  const prisma = {
    laundry_stores: { findUnique: vi.fn() },
    addresses: { findFirst: vi.fn() },
  };
  const mapsService = { computeRoute: vi.fn() };
  const service = new DeliveryFeeService(prisma as never, mapsService as never);

  prisma.laundry_stores.findUnique.mockResolvedValue({
    status: 'active',
    latitude: new Decimal('21.0285'),
    longitude: new Decimal('105.8542'),
  });
  prisma.addresses.findFirst.mockResolvedValue({
    latitude: new Decimal('21.0278'),
    longitude: new Decimal('105.8049'),
  });

  return { service, prisma, mapsService };
}

describe('DeliveryFeeService.quote', () => {
  it('prices the pickup and delivery legs separately', async () => {
    const { service, mapsService } = setup();
    mapsService.computeRoute.mockResolvedValue({ distanceMeters: 6892.3, durationSeconds: 590 });

    const result = await service.quote(20, 1, 5, 6);

    expect(result.pickup).toEqual({ address_id: 5, distance_km: 6.89, fee: 35000 });
    expect(result.delivery).toEqual({ address_id: 6, distance_km: 6.89, fee: 35000 });
    expect(result.total_fee).toBe(70000);
    expect(mapsService.computeRoute).toHaveBeenCalledTimes(2);
  });

  it('routes once when pickup and delivery are the same address but charges both legs', async () => {
    const { service, mapsService } = setup();
    mapsService.computeRoute.mockResolvedValue({ distanceMeters: 2000, durationSeconds: 300 });

    const result = await service.quote(20, 1, 5, 5);

    expect(mapsService.computeRoute).toHaveBeenCalledTimes(1);
    expect(result.total_fee).toBe(30000);
  });

  it('only looks up addresses owned by the customer', async () => {
    const { service, prisma, mapsService } = setup();
    mapsService.computeRoute.mockResolvedValue({ distanceMeters: 1000, durationSeconds: 100 });

    await service.quote(20, 1, 5, 5);

    expect(prisma.addresses.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5, user_id: 20 } }),
    );
  });

  it('rejects an address that is not the customer\'s', async () => {
    const { service, prisma } = setup();
    prisma.addresses.findFirst.mockResolvedValue(null);

    await expect(service.quote(20, 1, 5, 5)).rejects.toThrow('Address not found');
  });

  it('rejects an address without coordinates', async () => {
    const { service, prisma } = setup();
    prisma.addresses.findFirst.mockResolvedValue({ latitude: null, longitude: null });

    await expect(service.quote(20, 1, 5, 5)).rejects.toThrow('no coordinates');
  });

  it('rejects an inactive or unknown store', async () => {
    const { service, prisma } = setup();
    prisma.laundry_stores.findUnique.mockResolvedValue({ status: 'inactive', latitude: null, longitude: null });

    await expect(service.quote(20, 1, 5, 5)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a store without coordinates', async () => {
    const { service, prisma } = setup();
    prisma.laundry_stores.findUnique.mockResolvedValue({ status: 'active', latitude: null, longitude: null });

    await expect(service.quote(20, 1, 5, 5)).rejects.toThrow('Store has no coordinates');
  });

  it('rejects an address beyond the maximum delivery distance', async () => {
    const { service, mapsService } = setup();
    mapsService.computeRoute.mockResolvedValue({ distanceMeters: 15500, durationSeconds: 1800 });

    await expect(service.quote(20, 1, 5, 5)).rejects.toThrow('too far for delivery');
  });

  it.each([
    ['unavailable', new ServiceUnavailableException('down')],
    ['bad gateway', new BadGatewayException('bad')],
  ])('falls back to a straight-line estimate when routing is %s', async (_name, error) => {
    const { service, mapsService } = setup();
    mapsService.computeRoute.mockRejectedValue(error);

    const result = await service.quote(20, 1, 5, 5);

    // ~3,5 km đường chim bay x 1,3 ≈ 4,6 km -> phí vượt 3 km đầu.
    expect(result.pickup.distance_km).toBeGreaterThan(3);
    expect(result.pickup.fee).toBeGreaterThan(15000);
  });

  it('does not fall back when no route exists', async () => {
    const { service, mapsService } = setup();
    mapsService.computeRoute.mockRejectedValue(new BadRequestException('No route found'));

    await expect(service.quote(20, 1, 5, 5)).rejects.toThrow('No route found');
  });
});
