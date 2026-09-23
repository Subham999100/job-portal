import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PlatformValidationPipe } from './common/pipes/validation.pipe';

/**
 * Application Bootstrap Entry Point.
 *
 * Architectural Intent:
 * Centralizes application startup so that configuration validation,
 * global middleware, security policies, exception filters, and shutdown
 * hooks are initialized consistently before the HTTP listener accepts traffic.
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  try {
    // 1. Instantiate the NestJS application with buffered logging
    const app = await NestFactory.create(AppModule, {
      bufferLogs: true,
    });

    // 2. Resolve validated configuration service
    const configService = app.get(ConfigService);
    const port = configService.get<number>('app.port', 3000);
    const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
    const nodeEnv = configService.get<string>('app.nodeEnv', 'development');
    const corsOrigin = configService.get<string | string[]>('app.corsOrigin', '*');

    // 3. Configure CORS policy
    // Security note: In development, permissive or localhost origins are accepted.
    // In production, env.validation.ts guarantees CORS_ORIGIN cannot be '*' and
    // must be explicitly declared as trusted client domains.
    app.enableCors({
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Correlation-Id',
        'X-Requested-With',
      ],
      exposedHeaders: ['X-Correlation-Id'],
      credentials: true,
    });

    // 4. Set global REST API prefix
    // The canonical /health probe is excluded so infrastructure and orchestrators
    // can query it directly at the root.
    app.setGlobalPrefix(apiPrefix, {
      exclude: ['health'],
    });

    // 5. Mount global validation pipe
    // Enforces payload whitelisting, prevents prototype pollution, and transforms primitive types.
    app.useGlobalPipes(new PlatformValidationPipe());

    // 6. Mount centralized exception filters
    // Order matters: AllExceptionsFilter catches unhandled errors; HttpExceptionFilter handles HTTP errors.
    app.useGlobalFilters(
      new AllExceptionsFilter(configService),
      new HttpExceptionFilter(),
    );

    // 7. Enable graceful shutdown hooks
    // Ensures SIGINT and SIGTERM trigger lifecycle cleanup (closing DB pools, finishing active requests).
    app.enableShutdownHooks();

    // 8. Bind to port and begin accepting traffic
    await app.listen(port);

    logger.log(`================================================================`);
    logger.log(`Recruitment Platform Backend initialized successfully`);
    logger.log(`   Environment:   ${nodeEnv}`);
    logger.log(`   HTTP Port:     ${port}`);
    logger.log(`   API Prefix:    /${apiPrefix}`);
    logger.log(`   Health Check:  http://localhost:${port}/health`);
    logger.log(`================================================================`);
  } catch (error) {
    // Fatal startup error handling
    logger.error(
      `Fatal error encountered during application bootstrap: ${
        error instanceof Error ? error.message : String(error)
      }`,
      error instanceof Error ? error.stack : undefined,
    );
    process.exit(1);
  }
}

// Start application bootstrap
void bootstrap();
