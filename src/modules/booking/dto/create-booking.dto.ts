import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  DATE_REGEX,
  TIME_REGEX,
} from '../../store-schedule/schedule-time.util.js';

export class BookingItemDto {
  @IsString()
  @MaxLength(100)
  item_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}

export class CreateBookingDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  store_id: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  service_id: number;

  // true: khách tự mang đồ đến cửa hàng và tự nhận (không cần địa chỉ).
  // false: cửa hàng đến lấy và giao trả tận nơi (bắt buộc có địa chỉ).
  @IsBoolean()
  in_store: boolean;

  // Ngày và giờ bắt đầu của slot, lấy từ GET /stores/:id/schedules/available-slots.
  @Matches(DATE_REGEX, { message: 'pickup_date must be in YYYY-MM-DD format' })
  pickup_date: string;

  @Matches(TIME_REGEX, { message: 'slot_start must be in HH:mm format' })
  slot_start: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pickup_address_id?: number;

  // Bỏ trống = giao về cùng địa chỉ lấy đồ.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  delivery_address_id?: number;

  // Bắt buộc với dịch vụ tính theo kg (Decimal(6,2) nên tối đa 9999.99).
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(9999.99)
  estimated_weight_kg?: number;

  // Bắt buộc với dịch vụ tính theo món; với dịch vụ theo kg chỉ để ghi chú danh sách đồ.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => BookingItemDto)
  items?: BookingItemDto[];

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MaxLength(30)
  promotion_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  special_instructions?: string;
}
