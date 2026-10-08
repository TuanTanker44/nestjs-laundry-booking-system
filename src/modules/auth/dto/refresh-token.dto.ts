import {
  IsNumber,
  IsString,
  Matches,
} from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @Matches(/^[a-fA-F0-9]{64}$/, {
    message: 'token must be a 64-character hexadecimal string',
  })
  refreshToken: string;
}

export class RevokeRefreshTokenByUserDto {
  @IsNumber()
  id: string;
}