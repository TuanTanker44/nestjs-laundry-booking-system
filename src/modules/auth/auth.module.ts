import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
import { AuthRateLimitGuard } from "./guards/rate-limit.guard.js";
import { EmailModule } from "../../utils/email/email.module.js";

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_ACCESS_EXPIRES_IN') ?? '15m',
        },
      }),
    }),
    UserModule,
    RefreshTokenModule,
    PasswordResetTokenModule,
    EmailVerificationTokenModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RoleGuard, AuthRateLimitGuard, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
