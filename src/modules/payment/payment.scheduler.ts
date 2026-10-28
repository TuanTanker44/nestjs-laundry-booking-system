import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PaymentService } from './payment.service.js';

@Injectable()
export class PaymentScheduler {
  private readonly logger = new Logger(PaymentScheduler.name);

  constructor(private readonly paymentService: PaymentService) {}

  // Mỗi phút: đối soát giao dịch pending với cổng, đóng giao dịch quá hạn, thử lại hoàn tiền.
  @Cron(CronExpression.EVERY_MINUTE)
  async sweep() {
    try {
      await this.paymentService.sweep();
    } catch (error) {
      this.logger.error(
        `Payment sweep failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
