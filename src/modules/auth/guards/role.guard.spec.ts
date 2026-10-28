import { ForbiddenException } from '@nestjs/common';
import { vi } from 'vitest';
import { RoleGuard } from './role.guard.js';

function context(user: any, roles: string[] | undefined) {
  return {
    getHandler: vi.fn(), getClass: vi.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    reflectorRoles: roles,
  } as any;
}

describe('RoleGuard', () => {
  it('allows routes without role metadata', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(undefined) };
    expect(new RoleGuard(reflector as never).canActivate(context({ role: 'customer' }, undefined))).toBe(true);
  });

  it('allows a user whose role is required', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(['admin', 'manager']) };
    expect(new RoleGuard(reflector as never).canActivate(context({ role: 'admin' }, ['admin']))).toBe(true);
  });

  it('rejects missing authenticated user', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(['admin']) };
    expect(() => new RoleGuard(reflector as never).canActivate(context(undefined, ['admin']))).toThrow(ForbiddenException);
  });

  it('rejects insufficient role', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(['admin']) };
    expect(() => new RoleGuard(reflector as never).canActivate(context({ role: 'customer' }, ['admin']))).toThrow('Insufficient permissions');
  });
});
