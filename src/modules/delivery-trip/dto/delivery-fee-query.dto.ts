import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class DeliveryFeeQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  store_id: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  pickup_address_id: number;

  // Bỏ trống = giao về cùng địa chỉ lấy đồ (giống POST /bookings).
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  delivery_address_id?: number;
}
