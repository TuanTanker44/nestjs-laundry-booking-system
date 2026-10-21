import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { DATE_REGEX, TIME_REGEX } from '../schedule-time.util.js';

export class CreateScheduleExceptionDto {
  @Matches(DATE_REGEX, { message: 'exception_date must be in YYYY-MM-DD format' })
  exception_date: string;

  // true (mặc định): nghỉ cả ngày. false: mở với giờ riêng (cần open_time + close_time).
  @IsOptional()
  @IsBoolean()
  is_closed: boolean = true;

  @IsOptional()
  @Matches(TIME_REGEX, { message: 'open_time must be in HH:mm format' })
  open_time?: string;

  @IsOptional()
  @Matches(TIME_REGEX, { message: 'close_time must be in HH:mm format' })
  close_time?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
