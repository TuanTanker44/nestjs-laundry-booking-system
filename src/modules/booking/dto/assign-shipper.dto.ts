import { IsInt, Min } from 'class-validator';

export class AssignShipperDto {
  @IsInt()
  @Min(1)
  shipper_id!: number;
}
