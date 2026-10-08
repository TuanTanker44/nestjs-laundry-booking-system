import { Module } from "@nestjs/common";

import { PasswordResetTokenService } from "./password_reset_token.service.js";
import { PrismaModule } from "../../../prisma/prisma.module.js";

@Module({
  imports: [PrismaModule],
  providers: [PasswordResetTokenService],
  exports: [PasswordResetTokenService],
})
export class PasswordResetTokenModule {}