import { vi } from 'vitest';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  it('maps JWT payload to the request user shape', async () => {
    const config = { getOrThrow: vi.fn().mockReturnValue('secret') };
    const strategy = new JwtStrategy(config as never);
    await expect(strategy.validate({ sub: 7, email: 'a@test.com', role: 'customer' })).resolves.toEqual({ id: 7, email: 'a@test.com', role: 'customer' });
    expect(config.getOrThrow).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
  });
});
