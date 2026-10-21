import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_MS,
  refreshCookieOptions,
} from './auth.constants.js';

import { RateLimit } from './decorators/rate-limit.decorator.js';
import { AuthRateLimitGuard } from './guards/rate-limit.guard.js';

@Controller('auth')
@UseGuards(AuthRateLimitGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      ...refreshCookieOptions(),
      maxAge: REFRESH_TOKEN_TTL_MS,
    });
  }

  private getRefreshToken(req: Request): string {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token not found in cookies',
      );
    }

    return refreshToken;
  }

  @Post('register')
  @RateLimit({
    limit: 5,
    windowSeconds: 900,
    keyBy: ['ip'],
    message: 'Too many registration attempts. Please try again later.',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(
      dto.email,
      dto.password,
      dto.name,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    limit: 5,
    windowSeconds: 60,
    keyBy: ['ip', 'account'],
    message: 'Too many login attempts. Please try again later.',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      dto.email,
      dto.password,
    );

    this.setRefreshCookie(res, result.refresh_token);

    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    limit: 10,
    windowSeconds: 60,
    keyBy: ['ip'],
    message: 'Too many logout requests. Please try again later.',
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logout(this.getRefreshToken(req));

    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());

    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    limit: 10,
    windowSeconds: 60,
    keyBy: ['ip'],
    message: 'Too many refresh requests. Please try again later.',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refresh(this.getRefreshToken(req));

    this.setRefreshCookie(res, result.refresh_token);

    return {
      access_token: result.access_token,
    };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    limit: 5,
    windowSeconds: 900,
    keyBy: ['ip'],
    message: 'Too many verification attempts. Please try again later.',
  })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    limit: 3,
    windowSeconds: 900,
    keyBy: ['ip', 'account'],
    message: 'Too many verification email requests. Please try again later.',
  })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    limit: 3,
    windowSeconds: 900,
    keyBy: ['ip', 'account'],
    message: 'Too many password reset requests. Please try again later.',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @RateLimit({
    limit: 5,
    windowSeconds: 900,
    keyBy: ['ip'],
    message: 'Too many password reset attempts. Please try again later.',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.token,
      dto.password,
    );
  }
}
