import {
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

import {
  users_role_enum,
  users_status_enum,
} from '../../../generated/prisma/client.js';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
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
  @IsString()
  @MaxLength(255)
  password_hash?: string;

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