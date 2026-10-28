import { Decimal } from '@prisma/client/runtime/client';
import { vi } from 'vitest';
import { PromotionService } from './promotion.service.js';

const NOW = new Date('2026-10-28T10:00:00.000Z');
function setup() {
  const prisma = { promotions: { create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() }, $transaction: vi.fn() };
  return { service: new PromotionService(prisma as never), prisma };
}
function promotion(overrides: Record<string, unknown> = {}) {
  return { id: 1, code: 'SAVE10', description: 'Save', discount_type: 'percent', value: new Decimal(10), valid_from: new Date('2026-10-01T00:00:00.000Z'), valid_to: new Date('2026-10-31T23:59:59.999Z'), status: 'active', usage_limit: 10, used_count: 2, ...overrides } as any;
}

describe('PromotionService', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
  afterEach(() => vi.useRealTimers());

  it('creates a valid promotion and normalizes end date to the end of the day', async () => {
    const { service, prisma } = setup();
    prisma.promotions.create.mockResolvedValue(promotion());
    await expect(service.create({ id: 7, role: 'admin' }, { code: 'SAVE10', description: 'Save', discount_type: 'percent', value: 10, valid_from: '2026-10-01', valid_to: '2026-10-31', usage_limit: 10 } as any)).resolves.toMatchObject({ id: 1, code: 'SAVE10', value: 10 });
    expect(prisma.promotions.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ created_by: 7, valid_to: new Date('2026-10-31T23:59:59.999Z') }) }));
  });

  it('rejects percent value above 100', async () => {
    const { service } = setup();
    await expect(service.create({ id: 1, role: 'admin' }, { discount_type: 'percent', value: 101, valid_from: '2026-10-01', valid_to: '2026-10-31' } as any)).rejects.toThrow('must not exceed 100');
  });

  it('rejects invalid and reversed dates', async () => {
    const { service } = setup();
    await expect(service.create({ id: 1, role: 'admin' }, { discount_type: 'fixed', value: 10, valid_from: 'bad', valid_to: '2026-10-31' } as any)).rejects.toThrow('valid_from is not a valid date');
    await expect(service.create({ id: 1, role: 'admin' }, { discount_type: 'fixed', value: 10, valid_from: '2026-11-01', valid_to: '2026-10-31' } as any)).rejects.toThrow('valid_to must not be before');
  });

  it('evaluates an active promotion with normalized code', async () => {
    const { service, prisma } = setup();
    prisma.promotions.findUnique.mockResolvedValue(promotion());
    await expect(service.evaluate(prisma as never, ' save10 ', 200000)).resolves.toEqual({ id: 1, discount: 20000 });
    expect(prisma.promotions.findUnique).toHaveBeenCalledWith({ where: { code: 'SAVE10' } });
  });

  it.each([
    [null, 'Promotion code is invalid'],
    [promotion({ status: 'inactive' }), 'Promotion code is invalid'],
    [promotion({ valid_from: new Date('2026-11-01T00:00:00.000Z') }), 'expired or not active yet'],
    [promotion({ valid_to: new Date('2026-10-27T23:59:59.999Z') }), 'expired or not active yet'],
    [promotion({ used_count: 10 }), 'reached its usage limit'],
  ])('rejects invalid promotion state', async (value, message) => {
    const { service, prisma } = setup();
    prisma.promotions.findUnique.mockResolvedValue(value);
    await expect(service.evaluate(prisma as never, 'SAVE10', 100000)).rejects.toThrow(message);
  });

  it('consumes a promotion only when the atomic update affects a row', async () => {
    const { service } = setup();
    const db = { $executeRaw: vi.fn().mockResolvedValue(1) };
    await expect(service.consume(db as never, 1)).resolves.toBeUndefined();
    db.$executeRaw.mockResolvedValue(0);
    await expect(service.consume(db as never, 1)).rejects.toThrow('reached its usage limit');
  });

  it('releases one used promotion slot', async () => {
    const { service, prisma } = setup();
    const db = { promotions: { updateMany: vi.fn() } };
    await service.release(db as never, 5);
    expect(db.promotions.updateMany).toHaveBeenCalledWith({ where: { id: 5, used_count: { gt: 0 } }, data: { used_count: { decrement: 1 } } });
  });
});
