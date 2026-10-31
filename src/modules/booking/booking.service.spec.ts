import { Decimal } from '@prisma/client/runtime/client';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import { BookingService } from './booking.service.js';

const NOW = new Date('2026-10-28T10:00:00.000Z');

function setup() {
  const prisma = {
    bookings: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    services: { findFirst: vi.fn() },
    addresses: { count: vi.fn() },
    users: { findFirst: vi.fn() },
    delivery_trips: { findUnique: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
  };
  const storeService = {
    assertActive: vi.fn(),
    assertCanManageStore: vi.fn(),
  };
  const scheduleService = { findSlot: vi.fn() };
  const promotionService = { evaluate: vi.fn(), consume: vi.fn(), release: vi.fn() };
  const paymentService = { onBookingCancelled: vi.fn(), refundBooking: vi.fn() };
  const deliveryFeeService = { quote: vi.fn() };

  prisma.$transaction.mockImplementation(async (arg: unknown) => {
    if (typeof arg === 'function') return arg(prisma);
    return arg;
  });

  const service = new BookingService(
    prisma as never,
    storeService as never,
    scheduleService as never,
    promotionService as never,
    paymentService as never,
    deliveryFeeService as never,
  );

  return { service, prisma, storeService, scheduleService, promotionService, paymentService, deliveryFeeService };
}

function dto(overrides: Record<string, unknown> = {}) {
  return {
    store_id: 1,
    service_id: 10,
    pickup_date: '2026-11-03',
    slot_start: '10:00',
    in_store: true,
    estimated_weight_kg: 2,
    ...overrides,
  } as any;
}

function serviceRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    name: 'Wash',
    pricing_unit: 'per_kg',
    unit_price: new Decimal(15000),
    estimated_turnaround_hours: 24,
    ...overrides,
  } as any;
}

function booking(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    customer_id: 20,
    store_id: 1,
    status: 'confirmed',
    in_store: false,
    scheduled_pickup_start: new Date('2026-11-05T10:00:00.000Z'),
    unit_price: new Decimal(15000),
    pricing_unit: 'per_kg',
    discount_amount: new Decimal(0),
    delivery_price: null,
    estimated_weight_kg: new Decimal(2),
    actual_weight_kg: null,
    estimated_price: new Decimal(30000),
    final_price: null,
    booking_items: [],
    promotion_id: null,
    ...overrides,
  } as any;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

describe('BookingService', () => {
  describe('assignShipper', () => {
    const actor = { id: 1, role: 'laundry_staff' };
    const payload = { shipper_id: 12 };

    function readySetup(overrides: Record<string, unknown> = {}) {
      const context = setup();
      context.prisma.bookings.findUnique.mockResolvedValue(booking({
        status: 'ready_for_delivery', delivery_address_id: 30,
        estimated_delivery_at: new Date('2026-10-28T15:00:00Z'), ...overrides,
      }));
      context.prisma.bookings.updateMany.mockResolvedValue({ count: 1 });
      context.prisma.users.findFirst.mockResolvedValue({ id: 12 });
      context.prisma.delivery_trips.findUnique.mockResolvedValue(null);
      context.prisma.delivery_trips.upsert.mockResolvedValue({ id: 50, booking_id: 7, shipper_id: 12, trip_type: 'delivery', status: 'assigned' });
      return context;
    }

    it('creates an assigned delivery trip and keeps the booking ready_for_delivery', async () => {
      const { service, prisma, storeService } = readySetup();
      await expect(service.assignShipper(actor, 7, payload)).resolves.toMatchObject({ booking_id: 7, shipper_id: 12, status: 'assigned' });
      expect(storeService.assertCanManageStore).toHaveBeenCalledWith(actor, 1);
      expect(prisma.users.findFirst).toHaveBeenCalledWith({ where: { id: 12, role: 'shipper', status: 'active' }, select: { id: true } });
      expect(prisma.bookings.updateMany).toHaveBeenCalledWith({
        where: { id: 7, status: 'ready_for_delivery', store_id: 1, in_store: false, delivery_address_id: 30 },
        data: { updated_at: NOW },
      });
      expect(prisma.delivery_trips.upsert).toHaveBeenCalledWith({
        where: { booking_id_trip_type: { booking_id: 7, trip_type: 'delivery' } },
        create: { booking_id: 7, trip_type: 'delivery', shipper_id: 12, address_id: 30,
          scheduled_time: new Date('2026-10-28T15:00:00Z'), status: 'assigned' },
        update: { shipper_id: 12, status: 'assigned' },
      });
    });

    it.each(['unassigned', 'assigned'])('can assign or reassign an existing %s delivery trip', async (status) => {
      const { service, prisma } = readySetup();
      prisma.delivery_trips.findUnique.mockResolvedValue({ id: 50, status, shipper_id: 11 });
      await service.assignShipper(actor, 7, payload);
      expect(prisma.delivery_trips.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { shipper_id: 12, status: 'assigned' } }));
    });

    it('uses local store time when estimated_delivery_at is absent', async () => {
      const { service, prisma } = readySetup({ estimated_delivery_at: null });
      await service.assignShipper(actor, 7, payload);
      expect(prisma.delivery_trips.upsert).toHaveBeenCalledWith(expect.objectContaining({
        create: expect.objectContaining({ scheduled_time: new Date('2026-10-28T17:00:00Z') }),
      }));
    });

    it('rejects a missing booking', async () => {
      const { service, prisma } = readySetup();
      prisma.bookings.findUnique.mockResolvedValue(null);
      await expect(service.assignShipper(actor, 7, payload)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects staff who cannot manage the booking store before writing', async () => {
      const { service, prisma, storeService } = readySetup();
      storeService.assertCanManageStore.mockRejectedValue(new ForbiddenException());
      await expect(service.assignShipper(actor, 7, payload)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it.each(['confirmed', 'processing', 'delivering', 'completed', 'cancelled'])('rejects a booking in %s status', async (status) => {
      const { service, prisma } = readySetup({ status });
      await expect(service.assignShipper(actor, 7, payload)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it.each([{ in_store: true }, { delivery_address_id: null }])('rejects a booking without delivery support: %j', async (overrides) => {
      const { service, prisma } = readySetup(overrides);
      await expect(service.assignShipper(actor, 7, payload)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects missing, inactive, or non-shipper users', async () => {
      const { service, prisma } = readySetup();
      prisma.users.findFirst.mockResolvedValue(null);
      await expect(service.assignShipper(actor, 7, payload)).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.bookings.updateMany).not.toHaveBeenCalled();
      expect(prisma.delivery_trips.upsert).not.toHaveBeenCalled();
    });

    it('rejects a booking changed concurrently', async () => {
      const { service, prisma } = readySetup();
      prisma.bookings.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.assignShipper(actor, 7, payload)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.delivery_trips.upsert).not.toHaveBeenCalled();
    });

    it.each(['in_progress', 'completed', 'failed', 'cancelled'])('does not overwrite a %s delivery trip', async (status) => {
      const { service, prisma } = readySetup();
      prisma.delivery_trips.findUnique.mockResolvedValue({ id: 50, status });
      await expect(service.assignShipper(actor, 7, payload)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.delivery_trips.upsert).not.toHaveBeenCalled();
    });
  });

  describe('quote', () => {
    it('returns calculated price and remaining slots for a valid booking', async () => {
      const { service, prisma, scheduleService } = setup();
      prisma.services.findFirst.mockResolvedValue(serviceRecord());
      scheduleService.findSlot.mockResolvedValue({ start: '10:00', end: '11:00', capacity: 3 });
      prisma.bookings.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

      await expect(service.quote({ id: 20, role: 'customer' }, dto())).resolves.toMatchObject({
        slots_left: 2,
        subtotal: 30000,
        discount_amount: 0,
        delivery_price: null,
        estimated_price: 30000,
      });
      expect(prisma.services.findFirst).toHaveBeenCalled();
    });

    it('adds the server-computed delivery fee to the estimated price', async () => {
      const { service, prisma, scheduleService, deliveryFeeService } = setup();
      prisma.services.findFirst.mockResolvedValue(serviceRecord());
      scheduleService.findSlot.mockResolvedValue({ start: '10:00', end: '11:00', capacity: 3 });
      prisma.addresses.count.mockResolvedValue(2);
      deliveryFeeService.quote.mockResolvedValue({ total_fee: 40000 });

      await expect(
        service.quote(
          { id: 20, role: 'customer' },
          dto({ in_store: false, pickup_address_id: 5, delivery_address_id: 6 }),
        ),
      ).resolves.toMatchObject({ subtotal: 30000, delivery_price: 40000, estimated_price: 70000 });
      expect(deliveryFeeService.quote).toHaveBeenCalledWith(20, 1, 5, 6);
    });

    it('delivers to the pickup address when no delivery address is given', async () => {
      const { service, prisma, scheduleService, deliveryFeeService } = setup();
      prisma.services.findFirst.mockResolvedValue(serviceRecord());
      scheduleService.findSlot.mockResolvedValue({ start: '10:00', end: '11:00', capacity: 3 });
      prisma.addresses.count.mockResolvedValue(1);
      deliveryFeeService.quote.mockResolvedValue({ total_fee: 30000 });

      await service.quote({ id: 20, role: 'customer' }, dto({ in_store: false, pickup_address_id: 5 }));
      expect(deliveryFeeService.quote).toHaveBeenCalledWith(20, 1, 5, 5);
    });

    it('does not compute a delivery fee for in-store bookings', async () => {
      const { service, prisma, scheduleService, deliveryFeeService } = setup();
      prisma.services.findFirst.mockResolvedValue(serviceRecord());
      scheduleService.findSlot.mockResolvedValue({ start: '10:00', end: '11:00', capacity: 3 });

      await service.quote({ id: 20, role: 'customer' }, dto());
      expect(deliveryFeeService.quote).not.toHaveBeenCalled();
    });

    it('rejects invalid pickup date', async () => {
      const { service } = setup();
      await expect(service.quote({ id: 20, role: 'customer' }, dto({ pickup_date: 'bad-date' }))).rejects.toThrow('pickup_date is not a valid date');
    });

    it('requires addresses for delivery bookings', async () => {
      const { service } = setup();
      await expect(service.quote({ id: 20, role: 'customer' }, dto({ in_store: false }))).rejects.toThrow('pickup_address_id is required');
    });

    it('rejects addresses for in-store bookings', async () => {
      const { service } = setup();
      await expect(service.quote({ id: 20, role: 'customer' }, dto({ pickup_address_id: 1 }))).rejects.toThrow('Addresses must not be provided');
    });

    it('rejects a service that is not active or owned by the store', async () => {
      const { service, prisma } = setup();
      prisma.services.findFirst.mockResolvedValue(null);
      await expect(service.quote({ id: 20, role: 'customer' }, dto())).rejects.toBeInstanceOf(NotFoundException);
    });

    it('requires weight for per-kg services', async () => {
      const { service, prisma } = setup();
      prisma.services.findFirst.mockResolvedValue(serviceRecord());
      await expect(service.quote({ id: 20, role: 'customer' }, dto({ estimated_weight_kg: undefined }))).rejects.toThrow('estimated_weight_kg is required');
    });

    it('requires items for per-item services', async () => {
      const { service, prisma } = setup();
      prisma.services.findFirst.mockResolvedValue(serviceRecord({ pricing_unit: 'per_item' }));
      await expect(service.quote({ id: 20, role: 'customer' }, dto({ estimated_weight_kg: undefined }))).rejects.toThrow('items are required');
    });

    it('rejects a slot that does not exist', async () => {
      const { service, prisma, scheduleService } = setup();
      prisma.services.findFirst.mockResolvedValue(serviceRecord());
      scheduleService.findSlot.mockResolvedValue(null);
      await expect(service.quote({ id: 20, role: 'customer' }, dto())).rejects.toThrow('not an available slot');
    });

    it('rejects a full slot', async () => {
      const { service, prisma, scheduleService } = setup();
      prisma.services.findFirst.mockResolvedValue(serviceRecord());
      scheduleService.findSlot.mockResolvedValue({ start: '10:00', end: '11:00', capacity: 1 });
      prisma.bookings.count.mockResolvedValueOnce(1);
      await expect(service.quote({ id: 20, role: 'customer' }, dto())).rejects.toThrow('This time slot is full');
    });

    it('rejects when customer already has too many unpaid bookings', async () => {
      const { service, prisma, scheduleService } = setup();
      prisma.services.findFirst.mockResolvedValue(serviceRecord());
      scheduleService.findSlot.mockResolvedValue({ start: '10:00', end: '11:00', capacity: 3 });
      prisma.bookings.count.mockResolvedValueOnce(0).mockResolvedValueOnce(5);
      await expect(service.quote({ id: 20, role: 'customer' }, dto())).rejects.toThrow('unpaid bookings');
    });

    it('evaluates promotion and subtracts discount', async () => {
      const { service, prisma, scheduleService, promotionService } = setup();
      prisma.services.findFirst.mockResolvedValue(serviceRecord());
      scheduleService.findSlot.mockResolvedValue({ start: '10:00', end: '11:00', capacity: 3 });
      prisma.bookings.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      promotionService.evaluate.mockResolvedValue({ id: 99, discount: 5000 });

      await expect(service.quote({ id: 20, role: 'customer' }, dto({ promotion_code: 'SAVE5' }))).resolves.toMatchObject({ subtotal: 30000, discount_amount: 5000, estimated_price: 25000 });
      expect(promotionService.evaluate).toHaveBeenCalledWith(prisma, 'SAVE5', 30000);
    });
  });

  describe('create', () => {
    it('delegates to createOnce after sweeping stale bookings', async () => {
      const { service, prisma } = setup();
      const createOnce = vi.spyOn(service as any, 'createOnce').mockResolvedValue({ id: 1 });
      const result = await service.create({ id: 20, role: 'customer' }, dto());
      expect(result).toEqual({ id: 1 });
      expect(createOnce).toHaveBeenCalledTimes(1);
      expect(prisma.bookings.findMany).toHaveBeenCalled();
    });

    it('computes the delivery fee once, before the transaction, and reuses it on retries', async () => {
      const { service, deliveryFeeService } = setup();
      deliveryFeeService.quote.mockResolvedValue({ total_fee: 40000 });
      const createOnce = vi
        .spyOn(service as any, 'createOnce')
        .mockRejectedValueOnce(new Error('duplicate'))
        .mockResolvedValueOnce({ id: 3 });
      vi.spyOn(service as any, 'isUniqueViolation').mockReturnValue(true);
      const input = dto({ in_store: false, pickup_address_id: 5 });

      await service.create({ id: 20, role: 'customer' }, input);

      expect(deliveryFeeService.quote).toHaveBeenCalledTimes(1);
      expect(createOnce).toHaveBeenNthCalledWith(1, 20, input, 40000);
      expect(createOnce).toHaveBeenNthCalledWith(2, 20, input, 40000);
    });

    it('stores the delivery price and includes it in the estimated price', async () => {
      const { service, prisma, scheduleService, deliveryFeeService } = setup();
      prisma.services.findFirst.mockResolvedValue(serviceRecord());
      scheduleService.findSlot.mockResolvedValue({ start: '10:00', end: '11:00', capacity: 3 });
      prisma.addresses.count.mockResolvedValue(1);
      deliveryFeeService.quote.mockResolvedValue({ total_fee: 30000 });
      prisma.bookings.create.mockResolvedValue({ ...booking({ in_store: false }), booking_items: [] });

      await service.create({ id: 20, role: 'customer' }, dto({ in_store: false, pickup_address_id: 5 }));

      expect(prisma.bookings.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ delivery_price: 30000, estimated_price: 60000 }),
        }),
      );
    });

    it('retries unique violations and succeeds on a later attempt', async () => {
      const { service } = setup();
      vi.spyOn(service as any, 'createOnce')
        .mockRejectedValueOnce(new Error('duplicate'))
        .mockResolvedValueOnce({ id: 2 });
      vi.spyOn(service as any, 'isUniqueViolation').mockReturnValue(true);

      await expect(service.create({ id: 20, role: 'customer' }, dto())).resolves.toEqual({ id: 2 });
      expect((service as any).createOnce).toHaveBeenCalledTimes(2);
    });

    it('rethrows non-unique errors immediately', async () => {
      const { service } = setup();
      const error = new Error('database down');
      vi.spyOn(service as any, 'createOnce').mockRejectedValue(error);
      vi.spyOn(service as any, 'isUniqueViolation').mockReturnValue(false);
      await expect(service.create({ id: 20, role: 'customer' }, dto())).rejects.toBe(error);
      expect((service as any).createOnce).toHaveBeenCalledTimes(1);
    });

    it('throws conflict after three unique violations', async () => {
      const { service } = setup();
      vi.spyOn(service as any, 'createOnce').mockRejectedValue(new Error('duplicate'));
      vi.spyOn(service as any, 'isUniqueViolation').mockReturnValue(true);
      await expect(service.create({ id: 20, role: 'customer' }, dto())).rejects.toBeInstanceOf(ConflictException);
      expect((service as any).createOnce).toHaveBeenCalledTimes(3);
    });
  });

  describe('changeStatus', () => {
    it('rejects direct cancellation', async () => {
      const { service } = setup();
      await expect(service.changeStatus({ id: 1, role: 'laundry_staff' }, 7, { status: 'cancelled' } as any)).rejects.toThrow('Use POST /bookings/:id/cancel');
    });

    it('rejects an invalid status transition', async () => {
      const { service, storeService } = setup();
      vi.spyOn(service as any, 'getOrThrow').mockResolvedValue(booking({ status: 'completed' }));
      await expect(service.changeStatus({ id: 1, role: 'laundry_staff' }, 7, { status: 'processing' } as any)).rejects.toThrow('Cannot change booking status');
      expect(storeService.assertCanManageStore).toHaveBeenCalled();
    });

    it('rejects no-show before pickup time', async () => {
      const { service } = setup();
      vi.spyOn(service as any, 'getOrThrow').mockResolvedValue(booking({ scheduled_pickup_start: new Date('2026-11-05T10:00:00.000Z') }));
      await expect(service.changeStatus({ id: 1, role: 'laundry_staff' }, 7, { status: 'no_show' } as any)).rejects.toThrow('before its pickup time');
    });

    it('rejects no-show when no pickup time is scheduled', async () => {
      const { service } = setup();
      vi.spyOn(service as any, 'getOrThrow').mockResolvedValue(booking({ scheduled_pickup_start: null }));
      await expect(service.changeStatus({ id: 1, role: 'laundry_staff' }, 7, { status: 'no_show' } as any)).rejects.toThrow('without a scheduled pickup time');
    });

    it('rejects actual weight when target is not processing', async () => {
      const { service } = setup();
      vi.spyOn(service as any, 'getOrThrow').mockResolvedValue(booking());
      await expect(service.changeStatus({ id: 1, role: 'laundry_staff' }, 7, { status: 'picked_up', actual_weight_kg: 2 } as any)).rejects.toThrow('only accepted when moving to "processing"');
    });

    it('requires actual weight for per-kg processing', async () => {
      const { service } = setup();
      vi.spyOn(service as any, 'getOrThrow').mockResolvedValue(booking({ status: 'picked_up' }));
      await expect(service.changeStatus({ id: 1, role: 'laundry_staff' }, 7, { status: 'processing' } as any)).rejects.toThrow('actual_weight_kg is required');
    });

    it('recalculates final price when a per-kg booking starts processing', async () => {
      const { service, prisma } = setup();
      const updated = booking({ status: 'processing', final_price: new Decimal(40000), actual_weight_kg: new Decimal(3) });
      vi.spyOn(service as any, 'getOrThrow')
        .mockResolvedValueOnce(booking({ status: 'picked_up' }))
        .mockResolvedValueOnce(updated);
      prisma.bookings.updateMany.mockResolvedValue({ count: 1 });

      await expect(service.changeStatus({ id: 1, role: 'laundry_staff' }, 7, { status: 'processing', actual_weight_kg: 3 } as any)).resolves.toMatchObject({ id: 7, final_price: 45000 });
      expect(prisma.bookings.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ actual_weight_kg: 3, final_price: 45000 }) }));
    });

    it('calculates per-item final price from booking item quantities', async () => {
      const { service, prisma } = setup();
      const itemBooking = booking({ status: 'picked_up', pricing_unit: 'per_item', booking_items: [{ quantity: 2 }, { quantity: 3 }], discount_amount: new Decimal(5000) });
      vi.spyOn(service as any, 'getOrThrow')
        .mockResolvedValueOnce(itemBooking)
        .mockResolvedValueOnce(booking({ pricing_unit: 'per_item', final_price: new Decimal(95000) }));
      prisma.bookings.updateMany.mockResolvedValue({ count: 1 });

      await service.changeStatus({ id: 1, role: 'laundry_staff' }, 7, { status: 'processing' } as any);
      expect(prisma.bookings.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ final_price: 95000 }) }));
    });

    it('reports a conflict when another update wins the race', async () => {
      const { service, prisma } = setup();
      vi.spyOn(service as any, 'getOrThrow').mockResolvedValue(booking({ status: 'picked_up' }));
      prisma.bookings.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.changeStatus({ id: 1, role: 'laundry_staff' }, 7, { status: 'processing', actual_weight_kg: 2 } as any)).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
