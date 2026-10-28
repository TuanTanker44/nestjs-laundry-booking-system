import { vi } from 'vitest';
import { RefreshTokenService } from './refresh_token.service.js';

describe('RefreshTokenService', () => {
  beforeEach(() => { process.env.JWT_REFRESH_SECRET = 'secret'; });
  afterEach(() => { delete process.env.JWT_REFRESH_SECRET; vi.restoreAllMocks(); });

  it('generates a 64-character hex refresh token', () => {
    const token = new RefreshTokenService({} as never).generateRefreshToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('stores only the HMAC token hash', async () => {
    const prisma = { refresh_tokens: { create: vi.fn().mockResolvedValue({ id: 1 }) } };
    const service = new RefreshTokenService(prisma as never);
    await service.create(7, 'plain-token', new Date('2026-11-01T00:00:00Z'));
    expect(prisma.refresh_tokens.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ user_id: 7, token_hash: expect.stringMatching(/^[a-f0-9]{64}$/) }) }));
    expect(prisma.refresh_tokens.create.mock.calls[0][0].data.token_hash).not.toBe('plain-token');
  });

  it('finds token by its hash', async () => {
    const prisma = { refresh_tokens: { findUnique: vi.fn().mockResolvedValue({ id: 1 }) } };
    await new RefreshTokenService(prisma as never).findByToken('plain-token');
    expect(prisma.refresh_tokens.findUnique).toHaveBeenCalledWith({ where: { token_hash: expect.stringMatching(/^[a-f0-9]{64}$/) } });
  });

  it('returns whether atomic revoke changed a row', async () => {
    const prisma = { refresh_tokens: { updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 }) } };
    const service = new RefreshTokenService(prisma as never);
    await expect(service.revoke('token')).resolves.toBe(true);
    await expect(service.revoke('token')).resolves.toBe(false);
  });

  it('revokes all active sessions for a user and deletes expired tokens', async () => {
    const prisma = { refresh_tokens: { updateMany: vi.fn().mockResolvedValue({ count: 2 }), deleteMany: vi.fn().mockResolvedValue({ count: 3 }) } };
    const service = new RefreshTokenService(prisma as never);
    await service.revokeAllByUserId(7);
    await service.deleteExpired();
    expect(prisma.refresh_tokens.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { user_id: 7, revoked_at: null } }));
    expect(prisma.refresh_tokens.deleteMany).toHaveBeenCalled();
  });

  it('requires a refresh-token secret', async () => {
    delete process.env.JWT_REFRESH_SECRET;
    await expect(new RefreshTokenService({} as never).findByToken('token')).rejects.toThrow('JWT_REFRESH_SECRET is not configured');
  });
});
