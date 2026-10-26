import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';

import { bookings_status_enum } from '../../../generated/prisma/client.js';

export class UpdateBookingStatusDto {
  // Hủy đơn dùng POST /bookings/:id/cancel, không đi qua API này.
  @IsEnum(bookings_status_enum)
  status: bookings_status_enum;

  // Bắt buộc khi chuyển sang `processing` với dịch vụ tính theo kg
  // (cân thực tế quyết định final_price).
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(9999.99)
  actual_weight_kg?: number;
}
