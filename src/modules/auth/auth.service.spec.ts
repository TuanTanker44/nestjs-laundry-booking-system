import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { vi } from 'vitest';
import bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';

const NOW = new Date('2026-10-28T10:00:00.000Z');

function setup() {
  const userService = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    hashPassword: vi.fn().mockResolvedValue('HASHED'),
    create: vi.fn(),
    update: vi.fn(),
    changePassword: vi.fn(),
  };
  const refreshTokenService = {
    generateRefreshToken: vi.fn().mockReturnValue('refresh-2'),
    create: vi.fn(),
    revoke: vi.fn().mockResolvedValue(true),
    findByToken: vi.fn(),
    revokeAllByUserId: vi.fn(),
  };
  const passwordResetTokenService = {
    generateResetToken: vi.fn().mockReturnValue('reset-token'),
    create: vi.fn(),
    findByToken: vi.fn(),
    markAsUsed: vi.fn().mockResolvedValue(true),
  };
  const emailVerificationTokenService = {
    generateVerificationToken: vi.fn().mockReturnValue('verify-token'),
    create: vi.fn(),
    findByToken: vi.fn(),
    markAsUsed: vi.fn().mockResolvedValue(true),
  };
  const jwtService = { sign: vi.fn().mockReturnValue('access-token') };
  const emailService = { sendMail: vi.fn() };
  const service = new AuthService(
    userService as never,
    refreshTokenService as never,
    passwordResetTokenService as never,
    emailVerificationTokenService as never,
    jwtService as never,
    emailService as never,
  );
  return { service, userService, refreshTokenService, passwordResetTokenService, emailVerificationTokenService, jwtService, emailService };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  process.env.FRONTEND_URL = 'http://localhost:3000';
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('AuthService', () => {
  it('generates an access token through JwtService', () => {
    const { service, jwtService } = setup();
    expect(service.generateAccessToken({ sub: 1, email: 'a@test.com', role: 'customer' })).toBe('access-token');
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 1, email: 'a@test.com', role: 'customer' });
  });

  it('registers a new user and sends verification mail', async () => {
    const { service, userService, emailVerificationTokenService, emailService } = setup();
    userService.findByEmail.mockResolvedValue(null);
    userService.create.mockResolvedValue({ id: 7, email: 'new@test.com' });

    await expect(service.register('new@test.com', 'secret', 'New User')).resolves.toEqual({ id: 7, email: 'new@test.com' });
    expect(userService.hashPassword).toHaveBeenCalledWith('secret');
    expect(userService.create).toHaveBeenCalledWith(expect.objectContaining({ password_hash: 'HASHED' }));
    expect(emailVerificationTokenService.create).toHaveBeenCalledWith(7, 'verify-token', new Date('2026-10-28T10:10:00.000Z'));
    expect(emailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'new@test.com' }));
  });

  it('rejects registration when email already exists', async () => {
    const { service, userService } = setup();
    userService.findByEmail.mockResolvedValue({ id: 1 });
    await expect(service.register('existing@test.com', 'secret', 'User')).rejects.toThrow('Email already exists');
    expect(userService.create).not.toHaveBeenCalled();
  });

  it('logs in with valid credentials and creates refresh token', async () => {
    const { service, userService, refreshTokenService, jwtService } = setup();
    userService.findByEmail.mockResolvedValue({ id: 1, email: 'a@test.com', password_hash: await bcrypt.hash('secret', 4), status: 'active', full_name: 'A', role: 'customer' });
    await expect(service.login('a@test.com', 'secret')).resolves.toMatchObject({ access_token: 'access-token', refresh_token: 'refresh-2' });
    expect(jwtService.sign).toHaveBeenCalled();
    expect(refreshTokenService.create).toHaveBeenCalledWith(1, 'refresh-2', new Date('2026-11-27T10:00:00.000Z'));
  });

  it('rejects login for missing user', async () => {
    const { service, userService } = setup();
    userService.findByEmail.mockResolvedValue(null);
    await expect(service.login('missing@test.com', 'secret')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects login for inactive account after password verification', async () => {
    const { service, userService } = setup();
    userService.findByEmail.mockResolvedValue({ id: 1, email: 'a@test.com', password_hash: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', status: 'disabled', full_name: 'A', role: 'customer' });
    await expect(service.login('a@test.com', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logs out idempotently by revoking the supplied refresh token', async () => {
    const { service, refreshTokenService } = setup();
    await expect(service.logout('token')).resolves.toEqual({ message: 'Logged out successfully' });
    expect(refreshTokenService.revoke).toHaveBeenCalledWith('token');
  });

  it('refreshes a valid token atomically', async () => {
    const { service, refreshTokenService, userService } = setup();
    refreshTokenService.findByToken.mockResolvedValue({ user_id: 2, revoked_at: null, expires_at: new Date('2026-10-28T11:00:00.000Z') });
    userService.findById.mockResolvedValue({ id: 2, email: 'a@test.com', role: 'customer', status: 'active' });

    await expect(service.refresh('old')).resolves.toEqual({ access_token: 'access-token', refresh_token: 'refresh-2' });
    expect(refreshTokenService.revoke).toHaveBeenCalledWith('old');
  });

  it.each([
    [null, 'Invalid refresh token'],
    [{ user_id: 1, revoked_at: NOW, expires_at: new Date('2026-10-29T10:00:00.000Z') }, 'Refresh token has been revoked'],
    [{ user_id: 1, revoked_at: null, expires_at: new Date('2026-10-27T10:00:00.000Z') }, 'Refresh token has expired'],
  ])('rejects invalid refresh state', async (token, message) => {
    const { service, refreshTokenService } = setup();
    refreshTokenService.findByToken.mockResolvedValue(token);
    await expect(service.refresh('old')).rejects.toThrow(message);
  });

  it('rejects refresh when user is missing or inactive', async () => {
    const { service, refreshTokenService, userService } = setup();
    refreshTokenService.findByToken.mockResolvedValue({ user_id: 2, revoked_at: null, expires_at: new Date('2026-10-29T10:00:00.000Z') });
    userService.findById.mockResolvedValue(null);
    await expect(service.refresh('old')).rejects.toThrow('User not found or inactive');
  });

  it('rejects refresh when old token cannot be revoked', async () => {
    const { service, refreshTokenService, userService } = setup();
    refreshTokenService.findByToken.mockResolvedValue({ user_id: 2, revoked_at: null, expires_at: new Date('2026-10-29T10:00:00.000Z') });
    userService.findById.mockResolvedValue({ id: 2, email: 'a@test.com', role: 'customer', status: 'active' });
    refreshTokenService.revoke.mockResolvedValue(false);
    await expect(service.refresh('old')).rejects.toThrow('Refresh token has been revoked');
  });

  it('verifies a valid email token and marks it used', async () => {
    const { service, emailVerificationTokenService, userService } = setup();
    emailVerificationTokenService.findByToken.mockResolvedValue({ user_id: 3, used_at: null, expires_at: new Date('2026-10-29T10:00:00.000Z') });
    await expect(service.verifyEmail('token')).resolves.toEqual({ message: 'Email verified successfully' });
    expect(emailVerificationTokenService.markAsUsed).toHaveBeenCalledWith('token');
    expect(userService.update).toHaveBeenCalledWith(3, { email_verified_at: NOW });
  });

  it.each([
    [null, 'Invalid verification token'],
    [{ user_id: 1, used_at: NOW, expires_at: new Date('2026-10-29T10:00:00.000Z') }, 'Verification token has already been used'],
    [{ user_id: 1, used_at: null, expires_at: new Date('2026-10-27T10:00:00.000Z') }, 'Verification token has expired'],
  ])('rejects invalid verification token state', async (token, message) => {
    const { service, emailVerificationTokenService } = setup();
    emailVerificationTokenService.findByToken.mockResolvedValue(token);
    await expect(service.verifyEmail('token')).rejects.toThrow(message);
  });

  it('returns the same resend-verification message for unknown accounts', async () => {
    const { service, userService, emailService } = setup();
    userService.findByEmail.mockResolvedValue(null);
    await expect(service.resendVerification('unknown@test.com')).resolves.toEqual({ message: expect.stringContaining('If the account exists') });
    expect(emailService.sendMail).not.toHaveBeenCalled();
  });

  it('resends verification only for an existing unverified user', async () => {
    const { service, userService, emailVerificationTokenService, emailService } = setup();
    userService.findByEmail.mockResolvedValue({ id: 4, email: 'a@test.com', email_verified_at: null });
    await service.resendVerification('a@test.com');
    expect(emailVerificationTokenService.create).toHaveBeenCalled();
    expect(emailService.sendMail).toHaveBeenCalled();
  });

  it('creates a reset token and sends password-reset mail for an existing user', async () => {
    const { service, userService, passwordResetTokenService, emailService } = setup();
    userService.findByEmail.mockResolvedValue({ id: 8, email: 'a@test.com' });
    await service.forgotPassword('a@test.com');
    expect(passwordResetTokenService.create).toHaveBeenCalledWith(8, 'reset-token', new Date('2026-10-28T10:10:00.000Z'));
    expect(emailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@test.com' }));
  });

  it('does not disclose unknown email in forgot-password flow', async () => {
    const { service, userService, emailService } = setup();
    userService.findByEmail.mockResolvedValue(null);
    await expect(service.forgotPassword('unknown@test.com')).resolves.toEqual({ message: expect.stringContaining('If the email exists') });
    expect(emailService.sendMail).not.toHaveBeenCalled();
  });

  it('resets password and revokes all sessions', async () => {
    const { service, passwordResetTokenService, userService, refreshTokenService } = setup();
    passwordResetTokenService.findByToken.mockResolvedValue({ user_id: 9, used_at: null, expires_at: new Date('2026-10-29T10:00:00.000Z') });
    await expect(service.resetPassword('token', 'new-secret')).resolves.toEqual({ message: 'Password reset successfully' });
    expect(passwordResetTokenService.markAsUsed).toHaveBeenCalledWith('token');
    expect(userService.changePassword).toHaveBeenCalledWith(9, 'new-secret');
    expect(refreshTokenService.revokeAllByUserId).toHaveBeenCalledWith(9);
  });

  it('rejects reset for missing, used or expired token', async () => {
    const cases = [
      [null, 'Invalid reset token'],
      [{ user_id: 1, used_at: NOW, expires_at: new Date('2026-10-29T10:00:00.000Z') }, 'Reset token has already been used'],
      [{ user_id: 1, used_at: null, expires_at: new Date('2026-10-27T10:00:00.000Z') }, 'Reset token has expired'],
    ] as const;
    for (const [token, message] of cases) {
      const { service, passwordResetTokenService } = setup();
      passwordResetTokenService.findByToken.mockResolvedValue(token);
      await expect(service.resetPassword('token', 'new')).rejects.toThrow(message);
    }
  });
});
