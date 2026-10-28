import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxDate,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '../user.constants.js';

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

  // Chấp nhận chuỗi ISO (vd "2000-01-31"); null để xoá ngày sinh.
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @MaxDate(() => new Date(), {
    message: 'date_of_birth must not be in the future',
  })
  date_of_birth?: Date | null;

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

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  current_password: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  new_password: string;
}
