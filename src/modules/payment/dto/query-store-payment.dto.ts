import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import {
  payments_method_enum,
  payments_status_enum,
} from '../../../generated/prisma/client.js';

export class QueryStorePaymentDto {
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
  @IsEnum(payments_status_enum)
  status?: payments_status_enum;

  @IsOptional()
  @IsEnum(payments_method_enum)
  method?: payments_method_enum;
}
