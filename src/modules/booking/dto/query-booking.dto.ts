import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';

import { bookings_status_enum } from '../../../generated/prisma/client.js';
import { DATE_REGEX } from '../../store-schedule/schedule-time.util.js';

export class QueryBookingDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @IsEnum(bookings_status_enum)
  status?: bookings_status_enum;

  // Chỉ có tác dụng ở GET /bookings/manage: lọc theo cửa hàng.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  store_id?: number;

  // Chỉ có tác dụng ở GET /bookings/manage: lọc theo ngày lấy đồ (YYYY-MM-DD).
  @IsOptional()
  @Matches(DATE_REGEX, { message: 'date must be in YYYY-MM-DD format' })
  date?: string;
}
