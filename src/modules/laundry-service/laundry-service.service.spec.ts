import { Decimal } from '@prisma/client/runtime/client';
import { vi } from 'vitest';
import { LaundryServiceService } from './laundry-service.service.js';

function setup() {
  const prisma = { services: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() } };
  const storeService = { assertActive: vi.fn(), assertCanManageStore: vi.fn() };
  return { service: new LaundryServiceService(prisma as never, storeService as never), prisma, storeService };
}
const svc = (overrides: Record<string, unknown> = {}) => ({ id: 1, store_id: 5, name: 'Wash', description: null, pricing_unit: 'per_kg', unit_price: new Decimal(15000), estimated_turnaround_hours: 24, status: 'active', ...overrides }) as any;

describe('LaundryServiceService', () => {
  it('returns active store and global services', async () => {
    const { service, prisma } = setup();
    prisma.services.findMany.mockResolvedValue([svc(), svc({ id: 2, store_id: null, name: 'Dry' })]);
    await expect(service.findAllActive(5, { page: 1, limit: 10 } as any)).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: 1, scope: 'store', unit_price: 15000 }), expect.objectContaining({ id: 2, scope: 'global' })]));
  });

  it('requires store management permission before listing manageable services', async () => {
    const { service, storeService, prisma } = setup();
    await service.findAllManageable({ id: 1, role: 'admin' }, 5, { page: 1, limit: 10 } as any);
    expect(storeService.assertCanManageStore).toHaveBeenCalledWith({ id: 1, role: 'admin' }, 5);
    expect(prisma.services.findMany).toHaveBeenCalled();
  });

  it('rejects duplicate service names within the store', async () => {
    const { service, prisma } = setup();
    prisma.services.findFirst.mockResolvedValue({ id: 99 });
    await expect(service.create({ id: 1, role: 'admin' }, 5, { name: 'Wash', pricing_unit: 'per_kg', unit_price: 10000, status: 'active' } as any)).rejects.toThrow('already exists in this store');
  });

  it('creates a trimmed store service', async () => {
    const { service, prisma } = setup();
    prisma.services.findFirst.mockResolvedValue(null);
    prisma.services.create.mockResolvedValue(svc());
    await service.create({ id: 1, role: 'admin' }, 5, { name: '  Wash  ', pricing_unit: 'per_kg', unit_price: 10000, status: 'active' } as any);
    expect(prisma.services.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ name: 'Wash', store_id: 5 }) }));
  });

  it('updates an owned service and checks renamed duplicates', async () => {
    const { service, prisma } = setup();
    prisma.services.findFirst.mockResolvedValueOnce(svc()).mockResolvedValueOnce(null);
    prisma.services.update.mockResolvedValue(svc({ name: 'Dry' }));
    await service.update({ id: 1, role: 'admin' }, 5, 1, { name: ' Dry ' } as any);
    expect(prisma.services.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ name: 'Dry' }) }));
  });

  it('rejects update of service from another store', async () => {
    const { service, prisma } = setup();
    prisma.services.findFirst.mockResolvedValue(null);
    await expect(service.update({ id: 1, role: 'admin' }, 5, 99, { name: 'X' } as any)).rejects.toThrow('Service not found');
  });

  it('rejects update of missing global service', async () => {
    const { service, prisma } = setup();
    prisma.services.findFirst.mockResolvedValue(null);
    await expect(service.updateGlobal(99, { name: 'X' } as any)).rejects.toThrow('Global service not found');
  });

  it('updates a global service after duplicate check', async () => {
    const { service, prisma } = setup();
    prisma.services.findFirst.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null);
    prisma.services.update.mockResolvedValue(svc({ store_id: null }));
    await service.updateGlobal(1, { name: ' Global ' } as any);
    expect(prisma.services.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ name: 'Global' }) }));
  });

  it('deactivates a store service', async () => {
    const { service, prisma } = setup();
    prisma.services.findFirst.mockResolvedValue(svc());
    prisma.services.update.mockResolvedValue(svc({ status: 'inactive' }));
    await expect(service.deactivate({ id: 1, role: 'admin' }, 5, 1)).resolves.toEqual({ message: 'Service deactivated successfully' });
  });
});
