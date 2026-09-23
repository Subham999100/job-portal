import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
  Verbose = 'verbose',
}

/**
 * EnvironmentVariables defines the schema and constraints for all environment
 * variables consumed by the application.
 *
 * Validating at bootstrap guarantees fail-fast semantics: the server will
 * refuse to start if configuration is missing, malformed, or insecure,
 * rather than failing unpredictably during request execution.
 */
export class EnvironmentVariables {
  @IsEnum(Environment, {
    message: 'NODE_ENV must be one of: development, production, test',
  })
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber({}, { message: 'PORT must be a numeric integer' })
  @Min(1, { message: 'PORT must be >= 1' })
  @Max(65535, { message: 'PORT must be <= 65535' })
  @IsOptional()
  PORT: number = 3000;

  @IsString({ message: 'API_PREFIX must be a string' })
  @IsOptional()
  API_PREFIX: string = 'api/v1';

  @IsEnum(LogLevel, {
    message: 'LOG_LEVEL must be one of: error, warn, info, debug, verbose',
  })
  @IsOptional()
  LOG_LEVEL: LogLevel = LogLevel.Info;

  @IsString({ message: 'CORS_ORIGIN must be a string' })
  @IsOptional()
  CORS_ORIGIN: string = '*';

  @IsString({ message: 'DATABASE_URL must be a valid connection string' })
  @IsOptional()
  DATABASE_URL?: string;
}

/**
 * Validates the raw configuration object against the EnvironmentVariables class.
 *
 * Enforces production safety guardrails:
 * In production (NODE_ENV=production), permissive wildcard CORS ('*') is strictly
 * prohibited to avoid cross-origin credential and API exposure.
 *
 * @param config Raw process.env record
 * @returns Validated EnvironmentVariables instance
 * @throws Error detailing every validation failure if any constraint is violated
 */
export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorDetails = errors
      .map((err) => {
        const constraints = err.constraints
          ? Object.values(err.constraints).join(', ')
          : 'Unknown validation failure';
        return `  - ${err.property}: ${constraints} (received: ${JSON.stringify(config[err.property])})`;
      })
      .join('\n');

    throw new Error(
      `\n❌ Configuration validation failed at application startup:\n${errorDetails}\n` +
        `Please verify your .env file or environment definitions before restarting.\n`,
    );
  }

  // Security guardrail: forbid wildcard CORS in production
  if (validatedConfig.NODE_ENV === Environment.Production) {
    if (!validatedConfig.CORS_ORIGIN || validatedConfig.CORS_ORIGIN === '*') {
      throw new Error(
        `\n❌ Security constraint failure at startup:\n` +
          `  - In production (NODE_ENV=production), CORS_ORIGIN cannot be '*' or empty.\n` +
          `  - Explicit allowed domains must be specified (e.g. CORS_ORIGIN=https://app.recruitment.com).\n`,
      );
    }
  }

  return validatedConfig;
}
