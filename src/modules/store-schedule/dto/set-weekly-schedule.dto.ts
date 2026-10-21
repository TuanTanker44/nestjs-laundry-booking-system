import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { TIME_REGEX } from '../schedule-time.util.js';

export class ScheduleDayDto {
  // 0 = Chủ nhật, 1 = Thứ hai, ..., 6 = Thứ bảy (giống Date.getDay()).
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @Matches(TIME_REGEX, { message: 'open_time must be in HH:mm format' })
  open_time: string;

  @Matches(TIME_REGEX, { message: 'close_time must be in HH:mm format' })
  close_time: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(480)
  slot_duration_minutes: number = 60;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  max_bookings_per_slot: number = 5;
}

/**
 * Thay thế toàn bộ lịch tuần: ngày nào không có trong `schedules` được coi
 * là cửa hàng nghỉ cả ngày.
 */
export class SetWeeklyScheduleDto {
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => ScheduleDayDto)
  schedules: ScheduleDayDto[];
}
