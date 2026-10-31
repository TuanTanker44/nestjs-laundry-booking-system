import { vi } from 'vitest';
import { AddressService } from './address.service.js';

function setup() {
  const prisma = { addresses: { count: vi.fn(), create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn(), update: vi.fn(), delete: vi.fn() }, $transaction: vi.fn() };
  prisma.$transaction.mockImplementation(async (fn: any) => fn(prisma));
  const mapsService = { geocodeAddress: vi.fn() };
  return { service: new AddressService(prisma as never, mapsService as never), prisma, mapsService };
}
const address = (overrides: Record<string, unknown> = {}) => ({ id: 1, user_id: 7, label: 'Home', recipient_name: 'A', phone: '090', address_line: '123 ABC', ward: 'P. 1', district: 'Q. 1', city: 'HCM', latitude: null, longitude: null, is_default: true, created_at: new Date(), ...overrides }) as any;

describe('AddressService', () => {
  it('prefers geocoded coordinates over client fallback coordinates', async () => {
    const { service, prisma, mapsService } = setup();
    prisma.addresses.count.mockResolvedValue(1);
    mapsService.geocodeAddress.mockResolvedValue({ lat: 10, lng: 106 });

    await service.create(7, {
      recipient_name: 'Nguyễn Văn A', phone: '0901234567',
      address_line: '123 ABC', ward: 'P. 1', district: 'Q. 1', city: 'HCM',
      latitude: 11, longitude: 107,
    });

    expect(mapsService.geocodeAddress).toHaveBeenCalledWith('123 ABC, P. 1, Q. 1, HCM, Vietnam');
    expect(prisma.addresses.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ latitude: 10, longitude: 106 }),
    }));
  });

  it.each([
    { latitude: 10.762622, longitude: 106.660172 },
    { latitude: 0, longitude: 0 },
  ])('uses client coordinates when geocoding fails: %j', async (coordinates) => {
    const { service, prisma, mapsService } = setup();
    prisma.addresses.count.mockResolvedValue(0);
    mapsService.geocodeAddress.mockRejectedValue(new Error('Geocoding unavailable'));
    prisma.addresses.create.mockResolvedValue(address(coordinates));

    const result = await service.create(7, {
      recipient_name: 'Nguyễn Văn A', phone: '0901234567', address_line: '123 ABC',
      ...coordinates,
    });

    expect(result).toMatchObject(coordinates);
    expect(prisma.addresses.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ ...coordinates, is_default: true }),
    }));
  });

  it.each([
    { lat: 10.762622, long: 106.660172 },
    { lat: 0, long: 0 },
  ])('persists lat/long aliases as latitude/longitude on create: %j', async (coordinates) => {
    const { service, prisma, mapsService } = setup();
    prisma.addresses.count.mockResolvedValue(1);
    mapsService.geocodeAddress.mockRejectedValue(new Error('Geocoding unavailable'));

    await service.create(7, {
      recipient_name: 'Test User', phone: '0901234567', address_line: '123 ABC',
      ...coordinates,
    });

    expect(prisma.addresses.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ latitude: coordinates.lat, longitude: coordinates.long }),
    }));
    const data = prisma.addresses.create.mock.calls[0][0].data;
    expect(data).not.toHaveProperty('lat');
    expect(data).not.toHaveProperty('long');
  });

  it.each([
    {},
    { latitude: 10 },
    { latitude: null, longitude: null },
    { latitude: 91, longitude: 106 },
  ])('rejects creation without writing when geocoding fails without a valid fallback: %j', async (coordinates) => {
    const { service, prisma, mapsService } = setup();
    prisma.addresses.count.mockResolvedValue(1);
    mapsService.geocodeAddress.mockRejectedValue(new Error('Address not found'));

    await expect(service.create(7, {
      recipient_name: 'Nguyễn Văn A', phone: '0901234567', address_line: '123 ABC',
      ...coordinates,
    } as any)).rejects.toMatchObject({ status: 400 });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.addresses.create).not.toHaveBeenCalled();
    expect(prisma.addresses.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an exact duplicate across users with 409 before geocoding or writing', async () => {
    const { service, prisma, mapsService } = setup();
    prisma.addresses.findFirst.mockResolvedValue({ id: 99 });

    await expect(service.create(7, {
      recipient_name: 'Nguyễn Văn A',
      phone: '0901234567',
      address_line: '123 ABC',
      ward: 'P. 1',
      district: 'Q. 1',
      city: 'HCM',
      is_default: true,
    })).rejects.toMatchObject({ status: 409, message: 'Address already exists' });

    expect(prisma.addresses.findFirst).toHaveBeenCalledWith({
      where: { address_line: '123 ABC', ward: 'P. 1', district: 'Q. 1', city: 'HCM' },
      select: { id: true },
    });
    expect(mapsService.geocodeAddress).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.addresses.create).not.toHaveBeenCalled();
    expect(prisma.addresses.updateMany).not.toHaveBeenCalled();
  });

  it('matches missing optional location fields as null without ignoring them', async () => {
    const { service, prisma } = setup();
    prisma.addresses.findFirst.mockResolvedValue({ id: 99 });

    await expect(service.create(7, {
      recipient_name: 'Nguyễn Văn A', phone: '0901234567', address_line: '123 ABC',
    })).rejects.toMatchObject({ status: 409 });
    expect(prisma.addresses.findFirst).toHaveBeenCalledWith({
      where: { address_line: '123 ABC', ward: null, district: null, city: null },
      select: { id: true },
    });
  });

  it('creates an address when there is no exact match and preserves input casing and spaces', async () => {
    const { service, prisma, mapsService } = setup();
    prisma.addresses.findFirst.mockResolvedValue(null);
    prisma.addresses.count.mockResolvedValue(1);
    mapsService.geocodeAddress.mockResolvedValue({ lat: 10, lng: 106 });
    prisma.addresses.create.mockResolvedValue(address());

    await service.create(7, {
      recipient_name: 'Nguyễn Văn A', phone: '0901234567',
      address_line: '123 abc ', ward: '', district: 'Q. 1', city: 'hcm',
    });
    expect(prisma.addresses.findFirst).toHaveBeenCalledWith({
      where: { address_line: '123 abc ', ward: '', district: 'Q. 1', city: 'hcm' },
      select: { id: true },
    });
    expect(prisma.addresses.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ address_line: '123 abc ', ward: '', city: 'hcm', is_default: false }),
    }));
  });

  it('makes the first address default', async () => {
    const { service, prisma, mapsService } = setup();
    prisma.addresses.count.mockResolvedValue(0);
    mapsService.geocodeAddress.mockResolvedValue({ lat: 10, lng: 106 });
    prisma.addresses.create.mockResolvedValue(address());
    await service.create(7, { address_line: '123 ABC', city: 'HCM' } as any);
    expect(prisma.addresses.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ is_default: true, latitude: 10, longitude: 106 }) }));
  });

  it('unsets existing defaults when a new address is explicitly default', async () => {
    const { service, prisma, mapsService } = setup();
    mapsService.geocodeAddress.mockResolvedValue({ lat: 10, lng: 106 });
    prisma.addresses.count.mockResolvedValue(2);
    prisma.addresses.create.mockResolvedValue(address({ is_default: true }));
    await service.create(7, { address_line: '123 ABC', is_default: true } as any);
    expect(prisma.addresses.updateMany).toHaveBeenCalledWith({ where: { user_id: 7 }, data: { is_default: false } });
  });

  it('scopes lookup by user ownership', async () => {
    const { service, prisma } = setup();
    prisma.addresses.findFirst.mockResolvedValue(null);
    await expect(service.findOneByUser(7, 99)).rejects.toThrow('Address not found');
    expect(prisma.addresses.findFirst).toHaveBeenCalledWith({ where: { id: 99, user_id: 7 } });
  });

  it('does not geocode when location fields do not change', async () => {
    const { service, prisma, mapsService } = setup();
    prisma.addresses.findFirst.mockResolvedValue(address());
    prisma.addresses.update.mockResolvedValue(address());
    await service.update(7, 1, { label: 'Work' } as any);
    expect(mapsService.geocodeAddress).not.toHaveBeenCalled();
  });

  it('re-geocodes when location changes and can make address default', async () => {
    const { service, prisma, mapsService } = setup();
    prisma.addresses.findFirst.mockResolvedValue(address({ is_default: false }));
    mapsService.geocodeAddress.mockResolvedValue({ lat: 11, lng: 107 });
    prisma.addresses.update.mockResolvedValue(address({ is_default: true }));
    await service.update(7, 1, { city: 'Da Nang', is_default: true } as any);
    expect(mapsService.geocodeAddress).toHaveBeenCalled();
    expect(prisma.addresses.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ latitude: 11, longitude: 107, is_default: true }) }));
  });

  it('rejects a location change without writing when geocoding fails and no fallback is supplied', async () => {
    const { service, prisma, mapsService } = setup();
    prisma.addresses.findFirst.mockResolvedValue(address({ latitude: 10, longitude: 106, is_default: false }));
    mapsService.geocodeAddress.mockRejectedValue(new Error('Geocoding unavailable'));

    await expect(service.update(7, 1, { city: 'Da Nang', is_default: true }))
      .rejects.toMatchObject({ status: 400 });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.addresses.update).not.toHaveBeenCalled();
    expect(prisma.addresses.updateMany).not.toHaveBeenCalled();
  });

  it('uses client fallback coordinates when updating the location and geocoding fails', async () => {
    const { service, prisma, mapsService } = setup();
    prisma.addresses.findFirst.mockResolvedValue(address({ latitude: 10, longitude: 106 }));
    mapsService.geocodeAddress.mockRejectedValue(new Error('Geocoding unavailable'));

    await service.update(7, 1, { city: 'Da Nang', latitude: 16.0544, longitude: 108.2022 });

    expect(prisma.addresses.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ city: 'Da Nang', latitude: 16.0544, longitude: 108.2022 }),
    }));
  });

  it.each([
    { latitude: 0, longitude: 0 },
    { lat: 0, long: 0 },
  ])('can fill missing coordinates without changing the address text: %j', async (coordinates) => {
    const { service, prisma, mapsService } = setup();
    prisma.addresses.findFirst.mockResolvedValue(address());
    mapsService.geocodeAddress.mockRejectedValue(new Error('Geocoding unavailable'));

    await service.update(7, 1, coordinates);

    expect(prisma.addresses.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ latitude: 0, longitude: 0 }),
    }));
  });

  it('does not allow unsetting the only default address', async () => {
    const { service, prisma } = setup();
    prisma.addresses.findFirst.mockResolvedValue(address());
    await expect(service.update(7, 1, { is_default: false } as any)).rejects.toThrow('Cannot unset the default address');
  });

  it('sets one address as default in a transaction', async () => {
    const { service, prisma } = setup();
    prisma.addresses.findFirst.mockResolvedValue(address({ is_default: false }));
    prisma.addresses.update.mockResolvedValue(address({ is_default: true }));
    await service.setDefault(7, 1);
    expect(prisma.addresses.updateMany).toHaveBeenCalledWith({ where: { user_id: 7 }, data: { is_default: false } });
    expect(prisma.addresses.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { is_default: true } });
  });

  it('promotes the oldest address after deleting the default', async () => {
    const { service, prisma } = setup();
    prisma.addresses.findFirst.mockResolvedValueOnce(address({ is_default: true })).mockResolvedValueOnce({ id: 2 });
    prisma.addresses.delete.mockResolvedValue(address());
    await expect(service.remove(7, 1)).resolves.toEqual({ message: 'Address deleted successfully' });
    expect(prisma.addresses.update).toHaveBeenCalledWith({ where: { id: 2 }, data: { is_default: true } });
  });

  it('translates PostgreSQL foreign-key delete errors', async () => {
    const { service, prisma } = setup();
    prisma.addresses.findFirst.mockResolvedValue(address());
    prisma.$transaction.mockRejectedValue({ code: 'P2003' });
    await expect(service.remove(7, 1)).rejects.toThrow('being used by another record');
  });
});
