
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  recipient_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9+\-().\s]+$/, {
    message: 'phone must contain a valid phone number format',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  address_line?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ward?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  // Tọa độ dự phòng khi geocoding lỗi; phải gửi đủ cả hai trường.
  @ValidateIf(
    (dto: UpdateAddressDto) =>
      dto.latitude !== undefined || dto.longitude !== undefined,
  )
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ValidateIf(
    (dto: UpdateAddressDto) =>
      dto.latitude !== undefined || dto.longitude !== undefined,
  )
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  // Tương thích client gửi lat/long thay cho latitude/longitude.
  @ValidateIf(
    (dto: UpdateAddressDto) => dto.lat !== undefined || dto.long !== undefined,
  )
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ValidateIf(
    (dto: UpdateAddressDto) => dto.lat !== undefined || dto.long !== undefined,
  )
  @IsNumber()
  @Min(-180)
  @Max(180)
  long?: number;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
