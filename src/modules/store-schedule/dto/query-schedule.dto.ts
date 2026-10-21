import { IsOptional, Matches } from 'class-validator';
import { DATE_REGEX } from '../schedule-time.util.js';

export class QueryAvailableSlotsDto {
  @Matches(DATE_REGEX, { message: 'date must be in YYYY-MM-DD format' })
  date: string;
}

export class QueryScheduleExceptionsDto {
  // Mặc định: từ hôm nay trở đi.
  @IsOptional()
  @Matches(DATE_REGEX, { message: 'from must be in YYYY-MM-DD format' })
  from?: string;

  @IsOptional()
  @Matches(DATE_REGEX, { message: 'to must be in YYYY-MM-DD format' })
  to?: string;
}
