import { IsString, Matches } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @Matches(/^[a-fA-F0-9]{64}$/, {
    message: 'token must be a 64-character hexadecimal string',
  })
  token: string;
}