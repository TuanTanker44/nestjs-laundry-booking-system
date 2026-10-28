import { vi } from 'vitest';
import { PasswordResetTokenService } from './password_reset_token.service.js';

describe('PasswordResetTokenService', () => {
  beforeEach(() => { process.env.PASSWORD_RESET_TOKEN_SECRET = 'secret'; });
  afterEach(() => { delete process.env.PASSWORD_RESET_TOKEN_SECRET; });

  it('generates a secure reset token', () => {
    expect(new PasswordResetTokenService({} as never).generateResetToken()).toMatch(/^[a-f0-9]{64}$/);
  });

  it('creates and looks up reset tokens by HMAC hash', async () => {
    const prisma = { password_reset_tokens: { create: vi.fn(), findUnique: vi.fn() } };
    const service = new PasswordResetTokenService(prisma as never);
    await service.create(1, 'token', new Date('2026-11-01'));
    await service.findByToken('token');
    expect(prisma.password_reset_tokens.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ user_id: 1, token_hash: expect.stringMatching(/^[a-f0-9]{64}$/) }) }));
    expect(prisma.password_reset_tokens.findUnique).toHaveBeenCalledWith({ where: { token_hash: expect.stringMatching(/^[a-f0-9]{64}$/) } });
  });

  it('atomically marks a reset token as used', async () => {
    const prisma = { password_reset_tokens: { updateMany: vi.fn().mockResolvedValue({ count: 1 }), deleteMany: vi.fn() } };
    const service = new PasswordResetTokenService(prisma as never);
    await expect(service.markAsUsed('token')).resolves.toBe(true);
    await service.deleteExpired();
    expect(prisma.password_reset_tokens.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ used_at: null }) }));
  });

  it('requires reset-token secret', async () => {
    delete process.env.PASSWORD_RESET_TOKEN_SECRET;
    await expect(new PasswordResetTokenService({} as never).findByToken('token')).rejects.toThrow('PASSWORD_RESET_TOKEN_SECRET is not configured');
  });
});
