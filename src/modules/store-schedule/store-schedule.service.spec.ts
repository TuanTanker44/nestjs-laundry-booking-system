import { vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StoreScheduleService } from './store-schedule.service.js';

function timeDate(h: string) { return new Date(`1970-01-01T${h}:00.000Z`); }
function setup() {
  const prisma = {
    store_schedules: { findMany: vi.fn(), findUnique: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn() },
    store_schedule_exceptions: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
    bookings: { findMany: vi.fn() },
    $transaction: vi.fn().mockResolvedValue([]),
  };
  const storeService = { assertActive: vi.fn(), assertCanManageStore: vi.fn() };
  return { service: new StoreScheduleService(prisma as never, storeService as never), prisma, storeService };
}

describe('StoreScheduleService', () => {
  it('returns serialized weekly schedule', async () => {
    const { service, prisma } = setup();
    prisma.store_schedules.findMany.mockResolvedValue([{ id: 1, day_of_week: 1, open_time: timeDate('08:00'), close_time: timeDate('17:00'), slot_duration_minutes: 60, max_bookings_per_slot: 5 }]);
    await expect(service.getWeeklySchedule(1)).resolves.toEqual([{ id: 1, day_of_week: 1, open_time: '08:00', close_time: '17:00', slot_duration_minutes: 60, max_bookings_per_slot: 5 }]);
  });

  it('rejects duplicate schedule days', async () => {
    const { service } = setup();
    await expect(service.setWeeklySchedule({ id: 1, role: 'admin' }, 1, { schedules: [
      { day_of_week: 1, open_time: '08:00', close_time: '17:00', slot_duration_minutes: 60, max_bookings_per_slot: 5 },
      { day_of_week: 1, open_time: '09:00', close_time: '18:00', slot_duration_minutes: 60, max_bookings_per_slot: 5 },
    ] } as any)).rejects.toThrow('must not be duplicated');
  });

  it('rejects invalid opening intervals and oversized slots', async () => {
    const { service } = setup();
    await expect(service.setWeeklySchedule({ id: 1, role: 'admin' }, 1, { schedules: [{ day_of_week: 1, open_time: '17:00', close_time: '08:00', slot_duration_minutes: 60, max_bookings_per_slot: 5 }] } as any)).rejects.toThrow('must be earlier');
    await expect(service.setWeeklySchedule({ id: 1, role: 'admin' }, 1, { schedules: [{ day_of_week: 1, open_time: '08:00', close_time: '09:00', slot_duration_minutes: 120, max_bookings_per_slot: 5 }] } as any)).rejects.toThrow('longer than the opening hours');
  });

  it('creates closed exceptions without requiring times', async () => {
    const { service, prisma } = setup();
    prisma.store_schedule_exceptions.create.mockResolvedValue({ id: 1, exception_date: new Date('2026-11-01T00:00:00.000Z'), is_closed: true, open_time: null, close_time: null, reason: 'Holiday' });
    await expect(service.createException({ id: 1, role: 'admin' }, 1, { exception_date: '2026-11-01', is_closed: true, reason: 'Holiday' } as any)).resolves.toMatchObject({ is_closed: true, open_time: null, close_time: null });
  });

  it('requires times for open exceptions', async () => {
    const { service } = setup();
    await expect(service.createException({ id: 1, role: 'admin' }, 1, { exception_date: '2026-11-01', is_closed: false } as any)).rejects.toThrow('open_time and close_time are required');
  });

  it('returns null when findSlot falls outside the generated slots', async () => {
    const { service, prisma } = setup();
    prisma.store_schedules.findUnique.mockResolvedValue({ open_time: timeDate('08:00'), close_time: timeDate('10:00'), slot_duration_minutes: 60, max_bookings_per_slot: 5 });
    prisma.store_schedule_exceptions.findUnique.mockResolvedValue(null);
    await expect(service.findSlot(1, '2026-11-02', '10:00')).resolves.toBeNull();
  });

  it('finds a valid slot from weekly schedule', async () => {
    const { service, prisma } = setup();
    prisma.store_schedules.findUnique.mockResolvedValue({ open_time: timeDate('08:00'), close_time: timeDate('10:00'), slot_duration_minutes: 60, max_bookings_per_slot: 5 });
    prisma.store_schedule_exceptions.findUnique.mockResolvedValue(null);
    await expect(service.findSlot(1, '2026-11-02', '09:00')).resolves.toEqual({ start: '09:00', end: '10:00', capacity: 5, slot_duration_minutes: 60 });
  });

  it('returns closed day when an exception closes the store', async () => {
    const { service, prisma } = setup();
    prisma.store_schedules.findUnique.mockResolvedValue({ open_time: timeDate('08:00'), close_time: timeDate('10:00'), slot_duration_minutes: 60, max_bookings_per_slot: 5 });
    prisma.store_schedule_exceptions.findUnique.mockResolvedValue({ is_closed: true, reason: 'Holiday', open_time: null, close_time: null });
    await expect(service.findSlot(1, '2026-11-02', '09:00')).resolves.toBeNull();
  });

  it('reports available capacity after counting blocking bookings', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-01T01:00:00.000Z'));
    const { service, prisma } = setup();
    prisma.store_schedules.findUnique.mockResolvedValue({ open_time: timeDate('08:00'), close_time: timeDate('10:00'), slot_duration_minutes: 60, max_bookings_per_slot: 2 });
    prisma.store_schedule_exceptions.findUnique.mockResolvedValue(null);
    prisma.bookings.findMany.mockResolvedValue([{ scheduled_pickup_start: new Date('2026-11-02T08:00:00.000Z') }]);
    const result = await service.getAvailableSlots(1, '2026-11-02');
    expect(result.slots[0]).toMatchObject({ start: '08:00', booked: 1, available: 1, is_available: true });
    vi.useRealTimers();
  });

  it('rejects a date in the past', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-02T10:00:00.000Z'));
    const { service } = setup();
    await expect(service.getAvailableSlots(1, '2026-11-01')).rejects.toThrow('date must not be in the past');
    vi.useRealTimers();
  });

  it('reports missing exception on delete', async () => {
    const { service, prisma } = setup();
    prisma.store_schedule_exceptions.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.deleteException({ id: 1, role: 'admin' }, 1, 99)).rejects.toBeInstanceOf(NotFoundException);
  });
});
