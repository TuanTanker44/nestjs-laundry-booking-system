import {
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';

export class LogoutDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-fA-F0-9]{64}$/, {
    message: 'refreshToken must be a 64-character hexadecimal string',
  })
  refreshToken: string;
}