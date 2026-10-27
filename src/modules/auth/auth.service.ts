import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UserService } from '../user/user.service.js';
import { EmailVerificationTokenService } from './email_verification_token/email_verification_token.service.js';
import { PasswordResetTokenService } from './password_reset_token/password_reset_token.service.js';
import { RefreshTokenService } from './refresh_token/refresh_token.service.js';
import {
  ONE_TIME_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
} from './auth.constants.js';
import { EmailService } from '../../utils/email/email.service.js';
import { buildEmailVerificationTemplate } from '../../utils/email/templates/email-verification.template.js';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly passwordResetTokenService: PasswordResetTokenService,
    private readonly emailVerificationTokenService: EmailVerificationTokenService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) { }

  generateAccessToken(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  // Log token for dev test only.
  // Cần bổ sung cơ chế gửi email chứa token (chưa hash) trong tương lai.
  private logTokenForDev(purpose: string, email: string, token: string) {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    this.logger.debug(`[DEV ONLY] ${purpose} token for ${email} has sent to their email: ${token}`);
  }

  private async issueVerificationToken(userId: number, email: string) {
    const token = this.emailVerificationTokenService.generateVerificationToken();

    await this.emailVerificationTokenService.create(
      userId,
      token,
      new Date(Date.now() + ONE_TIME_TOKEN_TTL_MS),
    );

    const frontendUrl = process.env.FRONTEND_URL

    const verificationUrl = new URL(
      '/verify-email',
      frontendUrl,
    );

    verificationUrl.searchParams.set('token', token);

    await this.emailService.sendMail({
      to: email,
      subject: 'Xác thực tài khoản LaundryBooking',
      html: buildEmailVerificationTemplate(
        verificationUrl.toString(),
      ),
      text: `Xác thực tài khoản tại: ${verificationUrl.toString()}`,
    });

    this.logTokenForDev('Email verification', email, token);
  }

  async register(
    email: string,
    password: string,
    name: string,
  ) {
    const existingUser = await this.userService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await this.userService.hashPassword(password);

    const user = await this.userService.create({
      email,
      password_hash: passwordHash,
      name,
    });

    await this.issueVerificationToken(user.id, user.email);

    return {
      id: user.id,
      email: user.email,
    };
  }

  async login(
    email: string,
    password: string,
  ) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password_hash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Chỉ kiểm tra trạng thái sau khi mật khẩu đúng để không lộ trạng thái tài khoản.
    if (user.status !== 'active') {
      throw new ForbiddenException('Account is not active');
    }

    const accessToken = this.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = this.refreshTokenService.generateRefreshToken();

    await this.refreshTokenService.create(
      user.id,
      refreshToken,
      new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    };
  }

  async logout(refreshToken: string) {
    // Idempotent: token không tồn tại / đã thu hồi vẫn coi là đăng xuất thành công.
    await this.refreshTokenService.revoke(refreshToken);

    return {
      message: 'Logged out successfully',
    };
  }

  async refresh(refreshToken: string) {
    const token = await this.refreshTokenService.findByToken(refreshToken);

    if (!token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (token.revoked_at) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (token.expires_at <= new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = await this.userService.findById(token.user_id);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Thu hồi token cũ trước (atomic). Nếu 2 request refresh cùng lúc,
    // chỉ request đầu tiên thành công.
    const revoked = await this.refreshTokenService.revoke(refreshToken);

    if (!revoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const newRefreshToken = this.refreshTokenService.generateRefreshToken();

    await this.refreshTokenService.create(
      user.id,
      newRefreshToken,
      new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    );

    return {
      access_token: this.generateAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      }),
      refresh_token: newRefreshToken,
    };
  }

  async verifyEmail(token: string) {
    const verificationToken =
      await this.emailVerificationTokenService.findByToken(token);

    if (!verificationToken) {
      throw new UnauthorizedException('Invalid verification token');
    }

    if (verificationToken.used_at) {
      throw new UnauthorizedException(
        'Verification token has already been used',
      );
    }

    if (verificationToken.expires_at <= new Date()) {
      throw new UnauthorizedException('Verification token has expired');
    }

    const consumed = await this.emailVerificationTokenService.markAsUsed(token);

    if (!consumed) {
      throw new UnauthorizedException(
        'Verification token has already been used',
      );
    }

    await this.userService.update(verificationToken.user_id, {
      email_verified_at: new Date(),
    });

    return {
      message: 'Email verified successfully',
    };
  }

  async resendVerification(email: string) {
    const user = await this.userService.findByEmail(email);

    // Luôn trả cùng một message để không lộ email có tồn tại / đã xác minh hay chưa.
    if (user && !user.email_verified_at) {
      await this.issueVerificationToken(user.id, user.email);
    }

    return {
      message: 'If the account exists and is unverified, a verification email has been sent',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);

    if (user) {
      const token = this.passwordResetTokenService.generateResetToken();

      await this.passwordResetTokenService.create(
        user.id,
        token,
        new Date(Date.now() + ONE_TIME_TOKEN_TTL_MS),
      );

      this.logTokenForDev('Password reset', user.email, token);
      // TODO: gửi email reset password
    }

    return {
      message: 'If the email exists, a reset link has been sent',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ) {
    const resetToken =
      await this.passwordResetTokenService.findByToken(token);

    if (!resetToken) {
      throw new UnauthorizedException('Invalid reset token');
    }

    if (resetToken.used_at) {
      throw new UnauthorizedException('Reset token has already been used');
    }

    if (resetToken.expires_at <= new Date()) {
      throw new UnauthorizedException('Reset token has expired');
    }

    // Đánh dấu đã dùng trước (atomic) rồi mới đổi mật khẩu.
    const consumed = await this.passwordResetTokenService.markAsUsed(token);

    if (!consumed) {
      throw new UnauthorizedException('Reset token has already been used');
    }

    await this.userService.changePassword(resetToken.user_id, newPassword);

    // Đăng xuất tất cả các phiên đăng nhập hiện tại.
    await this.refreshTokenService.revokeAllByUserId(resetToken.user_id);

    return {
      message: 'Password reset successfully',
    };
  }
}
