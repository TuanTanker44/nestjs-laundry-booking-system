import { HttpException } from '@nestjs/common';
import { vi } from 'vitest';
import { AuthRateLimitGuard } from './rate-limit.guard.js';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator.js';

function context(request: any) {
  return { getHandler: vi.fn().mockReturnValue({ name: 'login' }), getClass: vi.fn().mockReturnValue({ name: 'AuthController' }), switchToHttp: () => ({ getRequest: () => request }) } as any;
}

describe('AuthRateLimitGuard', () => {
  afterEach(() => { delete process.env.RATE_LIMIT_ENABLED; delete process.env.REDIS_KEY_SECRET; });

  it('is disabled in non-production when explicitly disabled', async () => {
    process.env.NODE_ENV = 'test'; process.env.RATE_LIMIT_ENABLED = 'false';
    const reflector = { getAllAndOverride: vi.fn() };
    const redis = { incrementWithTtl: vi.fn() };
    await expect(new AuthRateLimitGuard(reflector as never, redis as never).canActivate(context({ ip: '1.2.3.4', body: {} }))).resolves.toBe(true);
    expect(reflector.getAllAndOverride).not.toHaveBeenCalled();
  });

  it('allows routes without rate-limit metadata', async () => {
    process.env.NODE_ENV = 'production';
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(undefined) };
    const redis = { incrementWithTtl: vi.fn() };
    await expect(new AuthRateLimitGuard(reflector as never, redis as never).canActivate(context({ ip: '1.2.3.4', body: {} }))).resolves.toBe(true);
  });

  it('increments Redis for configured identifiers', async () => {
    process.env.NODE_ENV = 'production'; process.env.REDIS_KEY_SECRET = 'secret';
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue({ keyBy: ['ip', 'account'], limit: 5, windowSeconds: 60 }) };
    const redis = { incrementWithTtl: vi.fn().mockResolvedValue(1) };
    await expect(new AuthRateLimitGuard(reflector as never, redis as never).canActivate(context({ ip: '1.2.3.4', body: { email: ' USER@Test.com ' } }))).resolves.toBe(true);
    expect(redis.incrementWithTtl).toHaveBeenCalledTimes(2);
    expect(redis.incrementWithTtl.mock.calls[0][0]).toMatch(/^laundry:production:auth:rate:.*:ip:/);
  });

  it('throws 429 after a configured identifier exceeds its limit', async () => {
    process.env.NODE_ENV = 'production'; process.env.REDIS_KEY_SECRET = 'secret';
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue({ keyBy: ['ip'], limit: 1, windowSeconds: 60, message: 'Slow down' }) };
    const redis = { incrementWithTtl: vi.fn().mockResolvedValue(2) };
    const guard = new AuthRateLimitGuard(reflector as never, redis as never);
    await expect(guard.canActivate(context({ ip: '1.2.3.4', body: {} }))).rejects.toMatchObject({ status: 429, message: 'Slow down' } as HttpException);
  });

  it('fails fast when the key secret is missing', async () => {
    process.env.NODE_ENV = 'production';
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue({ keyBy: ['ip'], limit: 1, windowSeconds: 60 }) };
    const redis = { incrementWithTtl: vi.fn() };
    await expect(new AuthRateLimitGuard(reflector as never, redis as never).canActivate(context({ ip: '1.2.3.4', body: {} }))).rejects.toThrow('REDIS_KEY_SECRET is not configured');
  });
});
