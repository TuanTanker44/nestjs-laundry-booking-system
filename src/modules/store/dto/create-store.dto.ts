import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { laundry_stores_status_enum } from '../../../generated/prisma/client.js';

export class CreateStoreDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @IsString()
  @MinLength(5)
  @MaxLength(255)
  address: string;

  // Nếu không gửi latitude/longitude, server sẽ tự geocode từ address.
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9+\-().\s]+$/, {
    message: 'phone must contain a valid phone number format',
  })
  phone?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(255)
  image_url?: string;

  // Chính sách hủy: hủy trước bao nhiêu giờ thì được hoàn bao nhiêu %.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(720)
  cancellation_hours_before?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  cancellation_refund_percent?: number;

  @IsOptional()
  @IsEnum(laundry_stores_status_enum)
  status?: laundry_stores_status_enum;
}
