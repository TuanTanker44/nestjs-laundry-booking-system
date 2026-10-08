import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-fA-F0-9]{64}$/, {
    message: 'token must be a 64-character hexadecimal string',
  })
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}