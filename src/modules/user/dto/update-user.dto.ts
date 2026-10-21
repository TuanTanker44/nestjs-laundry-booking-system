import {
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  users_role_enum,
  users_status_enum,
} from '../../../generated/prisma/client.js';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9+\-().\s]+$/, {
    message: 'phone must contain a valid phone number format',
  })
  phone?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(255)
  avatar_url?: string | null;
}

export class AdminUpdateUserDto extends UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsEnum(users_role_enum)
  role?: users_role_enum;

  @IsOptional()
  @IsEnum(users_status_enum)
  status?: users_status_enum;

  @IsOptional()
  @IsDate()
  email_verified_at?: Date | null;
}
