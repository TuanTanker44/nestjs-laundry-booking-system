import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { machines_type_enum } from '../../../generated/prisma/client.js';
import {
  MANUAL_MACHINE_STATUSES,
  type ManualMachineStatus,
} from '../machine.types.js';

export class UpdateMachineDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(machines_type_enum)
  type?: machines_type_enum;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(9999.99)
  capacity_kg?: number;

  // `running` chỉ đến từ việc gán máy cho đơn nên không đặt tay được.
  @IsOptional()
  @IsIn(MANUAL_MACHINE_STATUSES)
  status?: ManualMachineStatus;
}
