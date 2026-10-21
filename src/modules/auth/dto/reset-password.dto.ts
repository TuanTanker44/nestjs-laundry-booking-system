import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_REGEX } from '../auth.constants.js';

export class ResetPasswordDto {
  @IsString()
  @Matches(/^[a-fA-F0-9]{64}$/, {
    message: 'token must be a 64-character hexadecimal string',
  })
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;
}
