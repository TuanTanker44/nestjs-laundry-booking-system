import { vi } from 'vitest';
import { EmailVerificationTokenService } from './email_verification_token.service.js';

describe('EmailVerificationTokenService', () => {
  beforeEach(() => { process.env.EMAIL_VERIFICATION_TOKEN_SECRET = 'secret'; });
  afterEach(() => { delete process.env.EMAIL_VERIFICATION_TOKEN_SECRET; });

  it('generates a secure 64-character token', () => {
    expect(new EmailVerificationTokenService({} as never).generateVerificationToken()).toMatch(/^[a-f0-9]{64}$/);
  });

  it('creates a hashed verification token', async () => {
    const prisma = { email_verification_tokens: { create: vi.fn() } };
    await new EmailVerificationTokenService(prisma as never).create(1, 'token', new Date('2026-11-01'));
    expect(prisma.email_verification_tokens.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ user_id: 1, token_hash: expect.stringMatching(/^[a-f0-9]{64}$/) }) }));
  });

  it('looks up by token hash and atomically marks unused token', async () => {
    const prisma = { email_verification_tokens: { findUnique: vi.fn(), updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 }), deleteMany: vi.fn() } };
    const service = new EmailVerificationTokenService(prisma as never);
    await service.findByToken('token');
    await expect(service.markAsUsed('token')).resolves.toBe(true);
    await expect(service.markAsUsed('token')).resolves.toBe(false);
    await service.deleteExpired();
    expect(prisma.email_verification_tokens.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ used_at: null }) }));
    expect(prisma.email_verification_tokens.deleteMany).toHaveBeenCalled();
  });

  it('requires token secret', async () => {
    delete process.env.EMAIL_VERIFICATION_TOKEN_SECRET;
    const prisma = { email_verification_tokens: { findUnique: vi.fn() } };
    await expect(new EmailVerificationTokenService(prisma as never).findByToken('token')).rejects.toThrow('EMAIL_VERIFICATION_TOKEN_SECRET is not configured');
    expect(prisma.email_verification_tokens.findUnique).not.toHaveBeenCalled();
  });
});
