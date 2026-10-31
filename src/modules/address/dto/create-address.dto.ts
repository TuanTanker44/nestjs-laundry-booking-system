import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  recipient_name!: string;

  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9+\-().\s]+$/, {
    message: 'phone must contain a valid phone number format',
  })
  phone!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(255)
  address_line!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ward?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  // Tọa độ dự phòng khi geocoding lỗi; phải gửi đủ cả hai trường.
  @ValidateIf(
    (dto: CreateAddressDto) =>
      dto.latitude !== undefined || dto.longitude !== undefined,
  )
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ValidateIf(
    (dto: CreateAddressDto) =>
      dto.latitude !== undefined || dto.longitude !== undefined,
  )
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  // Tương thích client gửi lat/long thay cho latitude/longitude.
  @ValidateIf(
    (dto: CreateAddressDto) => dto.lat !== undefined || dto.long !== undefined,
  )
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ValidateIf(
    (dto: CreateAddressDto) => dto.lat !== undefined || dto.long !== undefined,
  )
  @IsNumber()
  @Min(-180)
  @Max(180)
  long?: number;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
