import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class AppService {
  constructor(private readonly prismaService: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async checkDatabaseHealth(): Promise<{ status: string }> {
    const isDatabaseHealthy = await this.prismaService.checkDatabaseHealth();
    return { status: isDatabaseHealthy ? 'healthy' : 'unhealthy' };
  }
}
