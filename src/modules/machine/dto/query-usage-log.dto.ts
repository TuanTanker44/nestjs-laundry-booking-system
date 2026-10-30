import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

import { DATE_REGEX } from '../../store-schedule/schedule-time.util.js';

export class QueryUsageLogDto {
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

  // Lọc theo ngày bắt đầu dùng máy (giờ cửa hàng), gồm cả ngày `to`.
  @IsOptional()
  @Matches(DATE_REGEX, { message: 'from must be in YYYY-MM-DD format' })
  from?: string;

  @IsOptional()
  @Matches(DATE_REGEX, { message: 'to must be in YYYY-MM-DD format' })
  to?: string;
}
