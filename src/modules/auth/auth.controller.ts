import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { LogoutDto } from './dto/logout.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }
    
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post("logout")
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get("verify-email")
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.emailVerificationToken);
  }

  @Post("resend-verification")
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
