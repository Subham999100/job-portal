import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_CONSTANTS } from '../common/constants/app.constants';
import { PrismaService } from '../database/prisma.service';

export interface HealthResponse {
  application: {
    status: 'ok';
    uptimeSeconds: number;
    timestamp: string;
    environment: string;
    version: string;
  };
  database: {
    status: 'connected' | 'disconnected' | 'unconfigured';
    latencyMs?: number;
    error?: string;
  };
}

/**
 * HealthService provides the canonical health status report.
 *
 * Design Rule:
 * Explicitly separates application status (whether this Node process is
 * running and serving requests) from dependency status (whether PostgreSQL
 * is reachable). PostgreSQL is only reported as 'connected' when a live ping
 * has succeeded.
 */
@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async getHealth(): Promise<HealthResponse> {
    const dbHealth = await this.prismaService.checkHealth();

    return {
      application: {
        status: 'ok',
        uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
        timestamp: new Date().toISOString(),
        environment:
          this.configService.get<string>('app.nodeEnv') || 'development',
        version: APP_CONSTANTS.VERSION,
      },
      database: dbHealth,
    };
  }
}
