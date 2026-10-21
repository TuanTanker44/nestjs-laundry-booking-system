import {
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { createHmac, randomBytes } from "node:crypto";
import { PrismaService } from "../../../prisma/prisma.service.js";

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private hashToken(token: string): string {
    const secret = process.env.JWT_REFRESH_SECRET

    if (!secret) {
      throw new InternalServerErrorException(
        "JWT_REFRESH_SECRET is not configured",
      );
    }

    return createHmac("sha256", secret)
      .update(token)
      .digest("hex");
  }

  generateRefreshToken() {
    return randomBytes(32).toString('hex');
  }

  async create(
    userId: number,
    token: string,
    expiresAt: Date,
  ) {
    const tokenHash = this.hashToken(token);

    return this.prisma.refresh_tokens.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });
  }

  async findByToken(token: string) {
    const tokenHash = this.hashToken(token);

    return this.prisma.refresh_tokens.findUnique({
      where: {
        token_hash: tokenHash,
      },
    });
  }

  /**
   * Thu hồi refresh token một cách atomic.
   * Trả về false nếu token không tồn tại hoặc đã bị thu hồi trước đó
   * (không ném lỗi Prisma P2025 như `update`).
   */
  async revoke(token: string): Promise<boolean> {
    const { count } = await this.prisma.refresh_tokens.updateMany({
      where: {
        token_hash: this.hashToken(token),
        revoked_at: null,
      },
      data: {
        revoked: true,
        revoked_at: new Date(),
      },
    });

    return count > 0;
  }

  async revokeAllByUserId(userId: number) {
    return this.prisma.refresh_tokens.updateMany({
      where: {
        user_id: userId,
        revoked_at: null,
      },
      data: {
        revoked: true,
        revoked_at: new Date(),
      },
    });
  }

  async deleteExpired() {
    return this.prisma.refresh_tokens.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });
  }
}