import { Module } from "@nestjs/common";

import { EmailVerificationTokenService } from "./email_verification_token.service.js";
import { PrismaModule } from "../../../prisma/prisma.module.js";

@Module({
  imports: [PrismaModule],
  providers: [EmailVerificationTokenService],
  exports: [EmailVerificationTokenService],
})
export class EmailVerificationTokenModule {}