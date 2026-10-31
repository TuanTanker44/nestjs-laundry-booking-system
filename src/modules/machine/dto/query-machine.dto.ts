import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import {
  machines_status_enum,
  machines_type_enum,
} from '../../../generated/prisma/client.js';

export class QueryMachineDto {
  // Trả thêm tình trạng máy trong scheduled_pickup_start/end của booking này.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  booking_id?: number;

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
  @IsEnum(machines_type_enum)
  type?: machines_type_enum;

  @IsOptional()
  @IsEnum(machines_status_enum)
  status?: machines_status_enum;
}
