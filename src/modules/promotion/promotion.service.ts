import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  formatDateOnly,
  parseDateOnly,
  storeNow,
} from '../store-schedule/schedule-time.util.js';
import { CreatePromotionDto } from './dto/create-promotion.dto.js';
import { QueryPromotionDto } from './dto/query-promotion.dto.js';
import { computeDiscount } from '../../utils/promotion.util.js';

type PromotionRecord = Prisma.promotionsGetPayload<object>;

interface Actor {
  id: number;
  role: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PromotionService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(promotion: PromotionRecord) {
    return {
      ...promotion,
      value: promotion.value.toNumber(),
      valid_from: formatDateOnly(promotion.valid_from),
      valid_to: formatDateOnly(promotion.valid_to),
    };
  }

  private requireDate(value: string, field: string): Date {
    const date = parseDateOnly(value);

    if (!date) {
      throw new BadRequestException(`${field} is not a valid date`);
    }

    return date;
  }

  // ------------------------------------------------------------ API cho admin

  async create(actor: Actor, dto: CreatePromotionDto) {
    if (dto.discount_type === 'percent' && dto.value > 100) {
      throw new BadRequestException('percent value must not exceed 100');
    }

    const validFrom = this.requireDate(dto.valid_from, 'valid_from');
    const validTo = this.requireDate(dto.valid_to, 'valid_to');

    if (validTo < validFrom) {
      throw new BadRequestException('valid_to must not be before valid_from');
    }

    try {
      const promotion = await this.prisma.promotions.create({
        data: {
          code: dto.code,
          description: dto.description,
          discount_type: dto.discount_type,
          value: dto.value,
          valid_from: validFrom,
          // Còn hiệu lực đến hết ngày valid_to.
          valid_to: new Date(validTo.getTime() + DAY_MS - 1),
          usage_limit: dto.usage_limit,
          created_by: actor.id,
        },
      });

      return this.serialize(promotion);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Promotion code already exists');
      }

      throw error;
    }
  }

  async findAll(query: QueryPromotionDto) {
    const { page, limit } = query;
    const search = query.search?.trim();

    const where: Prisma.promotionsWhereInput = {
      ...(query.status && { status: query.status }),
      ...(search && { code: { contains: search, mode: 'insensitive' } }),
    };

    const [total, promotions] = await this.prisma.$transaction([
      this.prisma.promotions.count({ where }),
      this.prisma.promotions.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: promotions.map((promotion) => this.serialize(promotion)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ------------------------------------------------------- Dành cho BookingModule

  /**
   * Kiểm tra mã và tính số tiền giảm cho `subtotal` (chưa trừ lượt dùng).
   * Mã sai / hết hạn / hết lượt đều trả 400 với thông báo riêng để khách biết lý do.
   */
  async evaluate(
    db: Prisma.TransactionClient,
    code: string,
    subtotal: number,
  ) {
    const promotion = await db.promotions.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!promotion || promotion.status !== 'active') {
      throw new BadRequestException('Promotion code is invalid');
    }

    // valid_from / valid_to theo giờ cửa hàng, nên so với giờ cửa hàng hiện tại.
    const now = storeNow();

    if (now < promotion.valid_from || now > promotion.valid_to) {
      throw new BadRequestException('Promotion code is expired or not active yet');
    }

    if (
      promotion.usage_limit !== null &&
      promotion.used_count >= promotion.usage_limit
    ) {
      throw new BadRequestException('Promotion code has reached its usage limit');
    }

    return {
      id: promotion.id,
      discount: computeDiscount(
        promotion.discount_type,
        promotion.value.toNumber(),
        subtotal,
      ),
    };
  }

  /**
   * Trừ một lượt dùng. Kiểm tra giới hạn ngay trong câu UPDATE để hai khách
   * dùng mã cùng lúc không vượt usage_limit (Prisma không so sánh 2 cột được
   * trong `where`, nên dùng SQL thuần).
   */
  async consume(db: Prisma.TransactionClient, promotionId: number) {
    const updated = await db.$executeRaw`
      UPDATE promotions
      SET used_count = used_count + 1
      WHERE id = ${promotionId}
        AND status = 'active'
        AND (usage_limit IS NULL OR used_count < usage_limit)
    `;

    if (updated === 0) {
      throw new BadRequestException('Promotion code has reached its usage limit');
    }
  }

  /** Hoàn lại một lượt dùng khi đơn bị hủy / hết hạn thanh toán. */
  async release(db: Prisma.TransactionClient, promotionId: number) {
    await db.promotions.updateMany({
      where: { id: promotionId, used_count: { gt: 0 } },
      data: { used_count: { decrement: 1 } },
    });
  }
}
