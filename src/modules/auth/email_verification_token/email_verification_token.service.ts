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
    return this.prisma.email_verification_tokens.findUnique({
      where: {
        token_hash: this.hashToken(token),
      },
    });
  }

  /**
   * Đánh dấu token đã dùng một cách atomic.
   * Trả về false nếu token đã bị dùng trước đó (tránh dùng 2 lần khi
   * có 2 request đồng thời).
   */
  async markAsUsed(token: string): Promise<boolean> {
    const { count } = await this.prisma.email_verification_tokens.updateMany({
      where: {
        token_hash: this.hashToken(token),
        used_at: null,
      },
      data: {
        used: true,
        used_at: new Date(),
      },
    });

    return count > 0;
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
