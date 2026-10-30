import { IsInt, Min } from 'class-validator';

export class AssignMachineDto {
  @IsInt()
  @Min(1)
  booking_id: number;
}
