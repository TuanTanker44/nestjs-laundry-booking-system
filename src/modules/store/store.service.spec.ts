import { Decimal } from '@prisma/client/runtime/client';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import { StoreService } from './store.service.js';

function setup() {
  const prisma = {
    laundry_stores: {
      findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(),
    },
    staff_assignments: { findUnique: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
    users: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(async (args: any) => Promise.all(args));
  const mapsService = { geocodeAddress: vi.fn() };
  return { service: new StoreService(prisma as never, mapsService as never), prisma, mapsService };
}

function store(overrides: Record<string, unknown> = {}) {
  return {
    id: 1, name: 'Store 1', address: '123 ABC, Quận 1, Hồ Chí Minh', description: null,
    phone: null, image_url: null, status: 'active', latitude: new Decimal(10.77), longitude: new Decimal(106.7),
    cancellation_hours_before: 2, cancellation_refund_percent: 100, created_by: 1,
    ...overrides,
  } as any;
}

describe('StoreService', () => {
  it('allows admin to manage a store without assignment', async () => {
    const { service, prisma } = setup();
    prisma.laundry_stores.findUnique.mockResolvedValue(store());
    await expect(service.assertCanManageStore({ id: 1, role: 'admin' }, 1)).resolves.toBeUndefined();
    expect(prisma.staff_assignments.findUnique).not.toHaveBeenCalled();
  });

  it('requires staff assignment for non-admin management', async () => {
    const { service, prisma } = setup();
    prisma.laundry_stores.findUnique.mockResolvedValue(store());
    prisma.staff_assignments.findUnique.mockResolvedValue(null);
    await expect(service.assertCanManageStore({ id: 5, role: 'laundry_staff' }, 1)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects management of a missing store', async () => {
    const { service, prisma } = setup();
    prisma.laundry_stores.findUnique.mockResolvedValue(null);
    await expect(service.assertCanManageStore({ id: 1, role: 'admin' }, 99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('treats inactive stores as not found for public access', async () => {
    const { service, prisma } = setup();
    prisma.laundry_stores.findUnique.mockResolvedValue(store({ status: 'inactive' }));
    await expect(service.assertActive(1)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.findActiveById(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('filters active stores and paginates by name without coordinates', async () => {
    const { service, prisma } = setup();
    prisma.laundry_stores.count.mockResolvedValue(2);
    prisma.laundry_stores.findMany.mockResolvedValue([store(), store({ id: 2, name: 'Store 2' })]);
    await expect(service.findAllActive({ page: 1, limit: 10, search: 'Store' } as any)).resolves.toMatchObject({ meta: { total: 2, totalPages: 1 } });
    expect(prisma.laundry_stores.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { name: 'asc' } }));
  });

  it('sorts stores by haversine distance when coordinates are provided', async () => {
    const { service, prisma } = setup();
    prisma.laundry_stores.findMany.mockResolvedValue([
      store({ id: 1, latitude: new Decimal(21.03), longitude: new Decimal(105.85) }),
      store({ id: 2, latitude: new Decimal(21.0286), longitude: new Decimal(105.854) }),
    ]);
    const result = await service.findAllActive({ page: 1, limit: 10, lat: 21.0285, lng: 105.8542 } as any);
    expect(result.data[0].id).toBe(2);
    expect(result.data[0].distance_km).toBe(0);
  });

  it('rejects when only one coordinate is supplied', async () => {
    const { service } = setup();
    await expect(service.findAllActive({ page: 1, limit: 10, lat: 21 } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a store using supplied coordinates', async () => {
    const { service, prisma, mapsService } = setup();
    prisma.laundry_stores.create.mockResolvedValue(store());
    await service.create({ id: 9, role: 'admin' }, { name: 'Store', address: 'A', latitude: 10, longitude: 106, status: 'active' } as any);
    expect(prisma.laundry_stores.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ latitude: 10, longitude: 106, created_by: 9 }) }));
    expect(mapsService.geocodeAddress).not.toHaveBeenCalled();
  });

  it('falls back to geocoding when coordinates are omitted', async () => {
    const { service, prisma, mapsService } = setup();
    mapsService.geocodeAddress.mockResolvedValue({ lat: 10.1, lng: 106.2 });
    prisma.laundry_stores.create.mockResolvedValue(store());
    await service.create({ id: 9, role: 'admin' }, { name: 'Store', address: 'A', status: 'active' } as any);
    expect(mapsService.geocodeAddress).toHaveBeenCalledWith('A, Vietnam');
  });

  it('rejects partial coordinate input', async () => {
    const { service } = setup();
    await expect(service.create({ id: 1, role: 'admin' }, { name: 'S', address: 'A', latitude: 10 } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents staff from changing store status', async () => {
    const { service, prisma } = setup();
    prisma.laundry_stores.findUnique.mockResolvedValue(store());
    prisma.staff_assignments.findUnique.mockResolvedValue({ id: 1 });
    await expect(service.update({ id: 2, role: 'laundry_staff' }, 1, { status: 'inactive' } as any)).rejects.toThrow('Only admin can change store status');
  });

  it('deactivates an existing store', async () => {
    const { service, prisma } = setup();
    prisma.laundry_stores.findUnique.mockResolvedValue(store());
    prisma.laundry_stores.update.mockResolvedValue(store({ status: 'inactive' }));
    await expect(service.deactivate(1)).resolves.toEqual({ message: 'Store deactivated successfully' });
    expect(prisma.laundry_stores.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { status: 'inactive' } });
  });

  it('assigns only active laundry staff', async () => {
    const { service, prisma } = setup();
    prisma.laundry_stores.findUnique.mockResolvedValue(store());
    prisma.users.findUnique.mockResolvedValue({ id: 5, role: 'laundry_staff', status: 'active' });
    prisma.staff_assignments.create.mockResolvedValue({ id: 2 });
    await expect(service.assignStaff(1, 5)).resolves.toEqual({ message: 'Staff assigned successfully' });
  });

  it('rejects assignment of non-staff users', async () => {
    const { service, prisma } = setup();
    prisma.laundry_stores.findUnique.mockResolvedValue(store());
    prisma.users.findUnique.mockResolvedValue({ id: 5, role: 'customer', status: 'active' });
    await expect(service.assignStaff(1, 5)).rejects.toThrow('User is not a laundry staff');
  });

  it('rejects assignment of inactive staff', async () => {
    const { service, prisma } = setup();
    prisma.laundry_stores.findUnique.mockResolvedValue(store());
    prisma.users.findUnique.mockResolvedValue({ id: 5, role: 'laundry_staff', status: 'inactive' });
    await expect(service.assignStaff(1, 5)).rejects.toThrow('Staff account is not active');
  });

  it('rejects unassign when no assignment exists', async () => {
    const { service, prisma } = setup();
    prisma.staff_assignments.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.unassignStaff(1, 5)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('ranks top selling stores by completed bookings then id', async () => {
    const { service, prisma } = setup();
    prisma.laundry_stores.findMany.mockResolvedValue([
      { ...store({ id: 2 }), _count: { bookings: 3 } },
      { ...store({ id: 1 }), _count: { bookings: 3 } },
      { ...store({ id: 3 }), _count: { bookings: 1 } },
    ]);
    await expect(service.getTopSellingStores()).resolves.toMatchObject([
      { id: 1, completedBookings: 3 },
      { id: 2, completedBookings: 3 },
      { id: 3, completedBookings: 1 },
    ]);
  });

  it('matches top selling stores by city, district and ward score', async () => {
    const { service, prisma } = setup();
    prisma.laundry_stores.findMany.mockResolvedValue([
      { ...store({ id: 1, address: 'A, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh' }), _count: { bookings: 1 } },
      { ...store({ id: 2, address: 'A, Phường khác, Quận 1, Thành phố Hồ Chí Minh' }), _count: { bookings: 10 } },
      { ...store({ id: 3, address: 'A, Quận 3, Thành phố Hồ Chí Minh' }), _count: { bookings: 100 } },
      { ...store({ id: 4, address: 'A, Quận 1, Hà Nội' }), _count: { bookings: 100 } },
    ]);
    const result = await service.getTopSellingStoresByArea({ city: 'TP. Hồ Chí Minh', district: 'Q. 1', ward: 'P. Bến Nghé' } as any);
    expect(result.map((x) => x.id)).toEqual([1, 2, 3]);
    expect(result[0].areaScore).toBe(3);
  });

  it('requires city for area ranking', async () => {
    const { service } = setup();
    await expect(service.getTopSellingStoresByArea({ district: '1' } as any)).rejects.toThrow('thành phố');
  });
});
