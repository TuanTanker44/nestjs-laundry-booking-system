import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxDate,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NormalizeEmail } from '../../../common/decorators/normalize-email.decorator.js';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '../auth.constants.js';

export class RegisterDto {
  @NormalizeEmail()
  @IsEmail()
  @MaxLength(150)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @MaxDate(() => new Date(), {
    message: 'date_of_birth must not be in the future',
  })
  date_of_birth?: Date;
}
