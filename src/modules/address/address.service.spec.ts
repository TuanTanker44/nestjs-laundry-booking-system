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
  it('makes the first address default', async () => {
    const { service, prisma, mapsService } = setup();
    prisma.addresses.count.mockResolvedValue(0);
    mapsService.geocodeAddress.mockResolvedValue({ lat: 10, lng: 106 });
    prisma.addresses.create.mockResolvedValue(address());
    await service.create(7, { address_line: '123 ABC', city: 'HCM' } as any);
    expect(prisma.addresses.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ is_default: true, latitude: 10, longitude: 106 }) }));
  });

  it('unsets existing defaults when a new address is explicitly default', async () => {
    const { service, prisma } = setup();
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
    prisma.addresses.findFirst.mockResolvedValue(address());
    mapsService.geocodeAddress.mockResolvedValue({ lat: 11, lng: 107 });
    prisma.addresses.update.mockResolvedValue(address({ is_default: true }));
    await service.update(7, 1, { city: 'Da Nang', is_default: true } as any);
    expect(mapsService.geocodeAddress).toHaveBeenCalled();
    expect(prisma.addresses.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ latitude: 11, longitude: 107, is_default: true }) }));
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
