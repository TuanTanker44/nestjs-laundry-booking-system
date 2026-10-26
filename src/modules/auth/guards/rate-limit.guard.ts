import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHmac } from 'node:crypto';
import type { Request } from 'express';

import { RedisService } from '../../../redis/redis.service.js';
import {
  RATE_LIMIT_KEY,
  type RateLimitOptions,
} from '../decorators/rate-limit.decorator.js';

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Tắt tạm khi dev/test (RATE_LIMIT_ENABLED=false). Production luôn bật.
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.RATE_LIMIT_ENABLED === 'false'
    ) {
      return true;
    }

    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const controller = context.getClass().name;
    const action = context.getHandler().name;

    const identifiers = this.getIdentifiers(request, options);

    for (const identifier of identifiers) {
      const key = this.buildKey(
        controller,
        action,
        identifier,
        options.windowSeconds,
      );

      const count = await this.redisService.incrementWithTtl(
        key,
        options.windowSeconds,
      );

      if (count > options.limit) {
        throw new HttpException(
          options.message ?? 'Too many requests. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return true;
  }

  private getIdentifiers(
    request: Request,
    options: RateLimitOptions,
  ): string[] {
    const identifiers: string[] = [];

    for (const type of options.keyBy) {
      if (type === 'ip') {
        identifiers.push(
          `ip:${this.hash(request.ip || 'unknown')}`,
        );
      }

      if (type === 'account') {
        const email = request.body?.email;

        if (typeof email === 'string' && email.trim()) {
          identifiers.push(
            `account:${this.hash(email.trim().toLowerCase())}`,
          );
        }
      }
    }

    return identifiers;
  }

  private buildKey(
    controller: string,
    action: string,
    identifier: string,
    windowSeconds: number,
  ): string {
    const env = process.env.NODE_ENV;

    return [
      'laundry',
      env,
      'auth',
      'rate',
      `${controller}:${action}`,
      identifier,
      `${windowSeconds}s`,
    ].join(':');
  }

  private hash(value: string): string {
    const secret = process.env.REDIS_KEY_SECRET;

    if (!secret) {
      throw new Error('REDIS_KEY_SECRET is not configured');
    }

    return createHmac('sha256', secret)
      .update(value)
      .digest('hex');
  }
}