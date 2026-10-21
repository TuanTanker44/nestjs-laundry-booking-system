import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { laundry_stores_status_enum } from '../../../generated/prisma/client.js';

export class QueryStoreDto {
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

  // Tìm theo tên hoặc địa chỉ.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  // Chỉ có tác dụng ở GET /stores/manage (GET /stores luôn chỉ trả cửa hàng active).
  @IsOptional()
  @IsEnum(laundry_stores_status_enum)
  status?: laundry_stores_status_enum;

  // Gửi cả lat và lng để sắp xếp theo khoảng cách gần nhất.
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;
}
