/**
 * Standardized application constants shared across the platform.
 */
export const APP_CONSTANTS = {
  APP_NAME: 'recruitment-platform-backend',
  VERSION: '0.1.0',
  DEFAULT_API_PREFIX: 'api/v1',
  CORRELATION_ID_HEADER: 'x-correlation-id',
  REQUEST_ID_HEADER: 'x-request-id',
  SENSITIVE_FIELD_NAMES: [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'authorization',
    'cookie',
    'apiKey',
  ],
} as const;
