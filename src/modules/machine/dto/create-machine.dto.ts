import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { machines_type_enum } from '../../../generated/prisma/client.js';

export class CreateMachineDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEnum(machines_type_enum)
  type: machines_type_enum;

  // Sức chứa (kg), tối đa 2 chữ số thập phân (khớp Decimal(6,2)). Bỏ trống thì dùng mặc định của DB.
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(9999.99)
  capacity_kg?: number;
}
