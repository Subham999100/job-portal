import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';

/**
 * AppModule is the root module of the modular monolith.
 *
 * Responsibilities:
 * 1. Coordinates global feature modules (Config, Database, Health, Auth).
 * 2. Mounts cross-cutting HTTP middleware (Correlation ID, Request Logging).
 * 3. Serves as the aggregation point where future domain modules will be registered.
 */
@Module({
  imports: [AppConfigModule, DatabaseModule, HealthModule, AuthModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Mount correlation tracking and request logging globally across all incoming routes
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggerMiddleware)
      .forRoutes({ path: '{*splat}', method: RequestMethod.ALL });
  }
}
