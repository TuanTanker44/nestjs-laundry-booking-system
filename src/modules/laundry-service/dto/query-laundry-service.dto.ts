import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import {
  services_pricing_unit_enum,
  services_status_enum,
} from '../../../generated/prisma/client.js';

export class QueryLaundryServiceDto {
  @IsOptional()
  @IsEnum(services_pricing_unit_enum)
  pricing_unit?: services_pricing_unit_enum;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  // Chỉ có tác dụng ở GET .../services/manage (API public luôn chỉ trả dịch vụ active).
  @IsOptional()
  @IsEnum(services_status_enum)
  status?: services_status_enum;
}
