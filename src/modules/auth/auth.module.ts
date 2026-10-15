import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { UserModule } from "../user/user.module.js";
import { RefreshTokenModule } from "./refresh_token/refresh_token.module.js";
import { PasswordResetTokenModule } from "./password_reset_token/password_reset_token.module.js";
import { EmailVerificationTokenModule } from "./email_verification_token/email_verification_token.module.js";
import { JwtAuthGuard } from "./guards/jwt.guard.js";
import { RoleGuard } from "./guards/role.guard.js";
import { JwtStrategy } from "./strategies/jwt.strategy.js";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'tuantapcodebackend',
      signOptions: {
        expiresIn: '1d',
      },
    }),
      UserModule,
      RefreshTokenModule,
      PasswordResetTokenModule,
      EmailVerificationTokenModule,
    ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RoleGuard, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
