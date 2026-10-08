import { Module } from "@nestjs/common";
import { RefreshTokenService } from "./refresh_token.service.js";
import { PrismaModule } from "../../../prisma/prisma.module.js";

@Module({
  imports: [PrismaModule],
  providers: [RefreshTokenService],
  exports: [RefreshTokenService],
})
    
export class RefreshTokenModule {}