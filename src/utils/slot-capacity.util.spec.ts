import { pendingHoldCutoff, slotBlockingWhere } from './slot-capacity.util.js';

describe('slot-capacity.util', () => {
  it('calculates the pending-payment cutoff 15 minutes before now', () => {
    const now = new Date('2026-10-28T10:00:00.000Z');
    expect(pendingHoldCutoff(now)).toEqual(
      new Date('2026-10-28T09:45:00.000Z'),
    );
  });

  it('builds the rule that excludes cancelled and no-show bookings', () => {
    const where = slotBlockingWhere(new Date('2026-10-28T10:00:00.000Z')) as any;
    expect(where.status).toEqual({ notIn: ['cancelled', 'no_show'] });
  });

  it('excludes stale pending-payment bookings', () => {
    const now = new Date('2026-10-28T10:00:00.000Z');
    const where = slotBlockingWhere(now) as any;

    expect(where.NOT).toEqual({
      status: 'pending_payment',
      created_at: { lt: new Date('2026-10-28T09:45:00.000Z') },
    });
  });
});
