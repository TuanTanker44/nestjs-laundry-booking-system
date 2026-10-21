import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AssignStaffDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  staff_id: number;
}
