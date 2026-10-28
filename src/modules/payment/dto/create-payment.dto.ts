import { IsIn, IsInt, Min } from 'class-validator';

import {
  ONLINE_PAYMENT_METHODS,
  type OnlinePaymentMethod,
} from '../payment.types.js';

export class CreatePaymentDto {
  @IsInt()
  @Min(1)
  booking_id: number;

  @IsIn(ONLINE_PAYMENT_METHODS)
  method: OnlinePaymentMethod;
}
