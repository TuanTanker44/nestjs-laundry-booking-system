import {
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";

import { createHmac, randomBytes } from "node:crypto";
import { PrismaService } from "../../../prisma/prisma.service.js";

@Injectable()
export class EmailVerificationTokenService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private hashToken(token: string): string {
    const secret = process.env.EMAIL_VERIFICATION_TOKEN_SECRET

    if (!secret) {
      throw new InternalServerErrorException(
        "EMAIL_VERIFICATION_TOKEN_SECRET is not configured",
      );
    }

    return createHmac("sha256", secret)
      .update(token)
      .digest("hex");
  }

  generateVerificationToken() {
    return randomBytes(32).toString('hex');
  }

  async create(
    userId: number,
    token: string,
    expiresAt: Date,
  ) {
    const tokenHash = this.hashToken(token);

    return this.prisma.email_verification_tokens.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });
  }

  async findByToken(token: string) {
    const tokenHash = this.hashToken(token);

    return this.prisma.email_verification_tokens.findUnique({
      where: {
        token_hash: tokenHash,
      },
    });
  }

  async markAsUsed(token: string) {
    const tokenHash = this.hashToken(token);

    return this.prisma.email_verification_tokens.update({
      where: {
        token_hash: tokenHash,
      },
      data: {
        used: true,
        used_at: new Date(),
      },
    });
  }

  async deleteExpired() {
    return this.prisma.email_verification_tokens.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });
  }
}