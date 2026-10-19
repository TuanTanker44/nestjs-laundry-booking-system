import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export type RateLimitIdentifier = 'ip' | 'account';

export interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
  keyBy: RateLimitIdentifier[];
  message?: string;
}

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);