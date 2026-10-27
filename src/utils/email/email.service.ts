import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.getOrThrow<string>('MAIL_HOST');
    const port = this.configService.getOrThrow<number>('MAIL_PORT');
    const secure =
      this.configService.get<string>('MAIL_SECURE') === 'true';

    this.from = this.configService.getOrThrow<string>('MAIL_FROM');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: this.configService.getOrThrow<string>('MAIL_USER'),
        pass: this.configService.getOrThrow<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendMail(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${params.to}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException(
        'Không thể gửi email. Vui lòng thử lại sau.',
      );
    }
  }
}