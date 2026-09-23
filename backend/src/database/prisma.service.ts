import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService manages database lifecycle connections for the modular monolith.
 *
 * Design Decisions:
 * 1. Implements OnModuleInit: connects to PostgreSQL when the application boots.
 * 2. Implements OnModuleDestroy: disconnects gracefully when shutdown signals (SIGINT/SIGTERM) fire.
 * 3. Graceful degradation: in Phase 00, if DATABASE_URL is not yet reachable or configured,
 *    it logs a warning rather than crashing the foundation bootstrap, allowing health
 *    and baseline HTTP scaffolding to be verified independently.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isDbConnected = false;

  constructor(private readonly configService: ConfigService) {
    super({
      log:
        configService.get<string>('app.logLevel') === 'debug'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    const databaseUrl = this.configService.get<string>('app.databaseUrl');

    if (!databaseUrl) {
      this.logger.warn(
        'DATABASE_URL is not configured. Database connection skipped for Phase 00 baseline.',
      );
      return;
    }

    try {
      this.logger.log('Initializing PostgreSQL database connection pool...');
      await this.$connect();
      this.isDbConnected = true;
      this.logger.log('✅ PostgreSQL database connection established successfully.');
    } catch (error) {
      this.isDbConnected = false;
      this.logger.error(
        `Failed to establish PostgreSQL connection on bootstrap: ${error instanceof Error ? error.message : error}`,
      );
      // We do not rethrow in Phase 00 so the foundation HTTP layer remains testable
      // without requiring a live PostgreSQL instance running in local environments.
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.isDbConnected) {
      this.logger.log('Gracefully closing PostgreSQL connection pool...');
      await this.$disconnect();
      this.isDbConnected = false;
      this.logger.log('PostgreSQL connection pool closed.');
    }
  }

  /**
   * Performs a lightweight ping check to verify database health.
   */
  async checkHealth(): Promise<{
    status: 'connected' | 'disconnected' | 'unconfigured';
    latencyMs?: number;
    error?: string;
  }> {
    const databaseUrl = this.configService.get<string>('app.databaseUrl');
    if (!databaseUrl) {
      return { status: 'unconfigured' };
    }

    const start = Date.now();
    try {
      // Execute raw 1 query to verify connection pool responsiveness
      await this.$queryRaw`SELECT 1`;
      return {
        status: 'connected',
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        status: 'disconnected',
        error: err instanceof Error ? err.message : 'Database ping failed',
      };
    }
  }
}
