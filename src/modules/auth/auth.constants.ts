import type { CookieOptions } from 'express';

export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const ONE_TIME_TOKEN_TTL_MS = 15 * 60 * 1000;

export const REFRESH_COOKIE_NAME = 'refresh_token';

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
export const PASSWORD_MESSAGE =
  'password must contain at least one uppercase letter, one lowercase letter and one number';

export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
  };
}
