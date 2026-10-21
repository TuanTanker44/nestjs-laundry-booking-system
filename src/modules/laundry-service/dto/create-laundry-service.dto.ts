import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import {
  services_pricing_unit_enum,
  services_status_enum,
} from '../../../generated/prisma/client.js';

export class CreateLaundryServiceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  // per_kg: tính theo ký, per_item: tính theo món.
  @IsOptional()
  @IsEnum(services_pricing_unit_enum)
  pricing_unit?: services_pricing_unit_enum;

  // Đơn giá (VND) trên mỗi đơn vị tính, tối đa 2 chữ số thập phân (khớp Decimal(10,2)).
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99_999_999.99)
  unit_price: number;

  // Thời gian xử lý dự kiến (giờ), dùng để ước tính thời điểm giao trả.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(720)
  estimated_turnaround_hours?: number;

  @IsOptional()
  @IsEnum(services_status_enum)
  status?: services_status_enum;
}
