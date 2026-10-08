import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { UserService } from "../user/user.service.js";
import {
  EmailVerificationTokenService,
} from "./email_verification_token/email_verification_token.service.js";
import {
  PasswordResetTokenService,
} from "./password_reset_token/password_reset_token.service.js";
import {
  RefreshTokenService,
} from "./refresh_token/refresh_token.service.js";

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly passwordResetTokenService: PasswordResetTokenService,
    private readonly emailVerificationTokenService:
      EmailVerificationTokenService,
    private readonly jwtService: JwtService,
  ) { }
  
  generateAccessToken(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  async register(
    email: string,
    password: string,
    name: string,
  ) {
    const existingUser =
      await this.userService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException(
        "Email already exists",
      );
    }
      
    const SALT_ROUNDS = process.env.SAlT_ROUNDS
    if (!SALT_ROUNDS) {
        throw new InternalServerErrorException(
            "PASSWORD_RESET_TOKEN_SECRET is not configured",
        );
    }

    const passwordHash = await bcrypt.hash(
      password,
      parseInt(SALT_ROUNDS),
    );

    const user = await this.userService.create({
      email,
      password_hash: passwordHash,
      name,
    });

    const verificationToken =
      randomBytes(32).toString("hex");

    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000,
    );

    await this.emailVerificationTokenService.create(
      user.id,
      verificationToken,
      expiresAt,
    );

    // TODO: gửi email verificationToken

    return {
      id: user.id,
      email: user.email,
    };
  }

  async login(
    email: string,
    password: string,
  ) {
    const user =
      await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(
        "Invalid credentials",
      );
    }

    const passwordValid =
      await bcrypt.compare(
        password,
        user.password_hash,
      );

    if (!passwordValid) {
      throw new UnauthorizedException(
        "Invalid credentials",
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(payload);

    const refreshToken = this.refreshTokenService.generateRefreshToken();

    const refreshTokenExpiresAt =
      new Date(
        Date.now() +
          30 * 24 * 60 * 60 * 1000,
      );

    await this.refreshTokenService.create(
      user.id,
      refreshToken,
      refreshTokenExpiresAt,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async logout(refreshToken: string) {
    await this.refreshTokenService.revoke(
      refreshToken,
    );

    return {
      message: "Logged out successfully",
    };
  }

  async refresh(refreshToken: string) {
    const token =
      await this.refreshTokenService.findByToken(
        refreshToken,
      );

    if (!token) {
      throw new UnauthorizedException(
        "Invalid refresh token",
      );
    }

    if (token.revoked_at) {
      throw new UnauthorizedException(
        "Refresh token has been revoked",
      );
    }

    if (token.expires_at <= new Date()) {
      throw new UnauthorizedException(
        "Refresh token has expired",
      );
    }

    const user = await this.userService.findById(token.user_id);

    if (!user) {
      throw new UnauthorizedException(
        "User not found",
      );
    }

    const accessToken = this.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    
    await this.refreshTokenService.revoke(refreshToken);

    const newRefreshToken = this.refreshTokenService.generateRefreshToken();
    await this.refreshTokenService.create(
      user.id,
      newRefreshToken,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    );

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }

  async verifyEmail(token: string) {
    const verificationToken =
      await this.emailVerificationTokenService
        .findByToken(token);

    if (!verificationToken) {
      throw new UnauthorizedException(
        "Invalid verification token",
      );
    }

    if (verificationToken.used_at) {
      throw new UnauthorizedException(
        "Verification token has already been used",
      );
    }

    if (
      verificationToken.expires_at <=
      new Date()
    ) {
      throw new UnauthorizedException(
        "Verification token has expired",
      );
    }

    await this.emailVerificationTokenService.markAsUsed(token);

    await this.emailVerificationTokenService
      .markAsUsed(token);

    return {
      message: "Email verified successfully",
    };
  }

  async resendVerification(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException(
        "User not found",
      );
    }

    const token = this.emailVerificationTokenService.generateVerificationToken();

    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000,
    );

    await this.emailVerificationTokenService.create(
      user.id,
      token,
      expiresAt,
    );

    // TODO: gửi email verification

    return {
      message:
        "Verification email has been sent",
    };
  }

  async forgotPassword(email: string) {
    const user =
      await this.userService.findByEmail(email);

    if (!user) {
      return {
        message:
          "If the email exists, a reset link has been sent",
      };
    }

    const token = this.passwordResetTokenService.generateResetToken();

    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000,
    );

    await this.passwordResetTokenService.create(
      user.id,
      token,
      expiresAt,
    );

    // TODO: gửi email reset password

    return {
      message:
        "If the email exists, a reset link has been sent",
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ) {
    const resetToken =
      await this.passwordResetTokenService
        .findByToken(token);

    if (!resetToken) {
      throw new UnauthorizedException(
        "Invalid reset token",
      );
    }

    if (resetToken.used_at) {
      throw new UnauthorizedException(
        "Reset token has already been used",
      );
    }

    if (
      resetToken.expires_at <= new Date()
    ) {
      throw new UnauthorizedException(
        "Reset token has expired",
      );
    }

    const SALT_ROUNDS = process.env.SAlT_ROUNDS
    if (!SALT_ROUNDS) {
        throw new InternalServerErrorException(
            "PASSWORD_RESET_TOKEN_SECRET is not configured",
        );
    }

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        parseInt(SALT_ROUNDS),
      );

    await this.userService.changePassword(
      resetToken.user_id,
      passwordHash,
    );

    await this.passwordResetTokenService
      .markAsUsed(token);

    // Revoke các refresh token hiện tại (logout tất cả các phiên đăng nhập)
    await this.refreshTokenService
      .revokeAllByUserId(
        resetToken.user_id,
      );

    return {
      message:
        "Password reset successfully",
    };
  }
}