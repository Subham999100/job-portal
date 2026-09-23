import { registerAs } from '@nestjs/config';
import { Environment, LogLevel } from './env.validation';

export interface AppConfig {
  nodeEnv: Environment;
  port: number;
  apiPrefix: string;
  logLevel: LogLevel;
  corsOrigin: string | string[];
  databaseUrl?: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
}

/**
 * Register strongly typed application configuration namespace.
 * Centralizing config mapping prevents magic strings and loose process.env
 * calls scattered across controllers and services.
 */
export const appConfig = registerAs('app', (): AppConfig => {
  const nodeEnv = (process.env.NODE_ENV as Environment) || Environment.Development;
  const rawCors = process.env.CORS_ORIGIN || '*';
  const corsOrigin = rawCors.includes(',')
    ? rawCors.split(',').map((origin) => origin.trim())
    : rawCors;

  return {
    nodeEnv,
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    logLevel: (process.env.LOG_LEVEL as LogLevel) || LogLevel.Info,
    corsOrigin,
    databaseUrl: process.env.DATABASE_URL,
    isProduction: nodeEnv === Environment.Production,
    isDevelopment: nodeEnv === Environment.Development,
    isTest: nodeEnv === Environment.Test,
  };
});
