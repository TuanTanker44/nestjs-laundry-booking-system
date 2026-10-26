import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { promotions_status_enum } from '../../../generated/prisma/client.js';

export class QueryPromotionDto {
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

  // Tìm theo mã.
  @IsOptional()
  @IsString()
  @MaxLength(30)
  search?: string;

  @IsOptional()
  @IsEnum(promotions_status_enum)
  status?: promotions_status_enum;
}
