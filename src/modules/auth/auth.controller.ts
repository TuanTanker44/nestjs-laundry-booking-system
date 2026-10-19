import {
  Body,
  Controller,
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

import { RateLimit } from './decorators/rate-limit.decorator.js';
import { AuthRateLimitGuard } from './guards/rate-limit.guard.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @UseGuards(AuthRateLimitGuard)
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
  @UseGuards(AuthRateLimitGuard)
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

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Post('logout')
  @UseGuards(AuthRateLimitGuard)
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
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token not found in cookies',
      );
    }

    const result = await this.authService.logout(refreshToken);

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
    });

    return result;
  }

  @Post('refresh')
  @UseGuards(AuthRateLimitGuard)
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
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token not found in cookies',
      );
    }

    const result = await this.authService.refresh(refreshToken);

    if (result.refresh_token) {
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    return {
      access_token: result.access_token,
    };
  }

  @Post('verify-email')
  @UseGuards(AuthRateLimitGuard)
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
  @UseGuards(AuthRateLimitGuard)
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
  @UseGuards(AuthRateLimitGuard)
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
  @UseGuards(AuthRateLimitGuard)
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