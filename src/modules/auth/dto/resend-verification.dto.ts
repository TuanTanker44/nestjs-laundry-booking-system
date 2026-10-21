import { IsEmail, MaxLength } from 'class-validator';
import { NormalizeEmail } from '../../../common/decorators/normalize-email.decorator.js';

export class ResendVerificationDto {
  @NormalizeEmail()
  @IsEmail()
  @MaxLength(150)
  email: string;
}
