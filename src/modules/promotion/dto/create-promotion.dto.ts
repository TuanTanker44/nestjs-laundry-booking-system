import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { promotions_discount_type_enum } from '../../../generated/prisma/client.js';
import { DATE_REGEX } from '../../store-schedule/schedule-time.util.js';

export class CreatePromotionDto {
  // Mã luôn lưu IN HOA để khách nhập chữ thường vẫn dùng được.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z0-9_-]{3,30}$/, {
    message: 'code must be 3-30 characters: letters, digits, "_" or "-"',
  })
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  // percent: giảm theo %, fixed: giảm số tiền cố định (VND).
  @IsEnum(promotions_discount_type_enum)
  discount_type: promotions_discount_type_enum;

  // percent: 0.01 - 100; fixed: số tiền (VND). Tối đa 2 chữ số thập phân.
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99_999_999.99)
  value: number;

  // YYYY-MM-DD, tính từ 00:00 của ngày này (giờ cửa hàng).
  @Matches(DATE_REGEX, { message: 'valid_from must be in YYYY-MM-DD format' })
  valid_from: string;

  // YYYY-MM-DD, còn hiệu lực đến hết ngày này (23:59:59).
  @Matches(DATE_REGEX, { message: 'valid_to must be in YYYY-MM-DD format' })
  valid_to: string;

  // Bỏ trống = không giới hạn số lần dùng.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usage_limit?: number;
}
