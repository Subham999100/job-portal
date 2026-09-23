import {
  Environment,
  LogLevel,
  validateEnvironment,
} from '../../src/config/env.validation';

describe('Configuration & Environment Validation', () => {
  it('should accept valid environment configurations and apply sensible defaults', () => {
    const rawConfig = {
      NODE_ENV: 'development',
      PORT: '4000',
      API_PREFIX: 'api/v1',
      LOG_LEVEL: 'debug',
      CORS_ORIGIN: 'http://localhost:3000',
    };

    const validated = validateEnvironment(rawConfig);

    expect(validated.NODE_ENV).toBe(Environment.Development);
    expect(validated.PORT).toBe(4000);
    expect(validated.API_PREFIX).toBe('api/v1');
    expect(validated.LOG_LEVEL).toBe(LogLevel.Debug);
    expect(validated.CORS_ORIGIN).toBe('http://localhost:3000');
  });

  it('should apply default values when optional fields are omitted in development', () => {
    const rawConfig = {};

    const validated = validateEnvironment(rawConfig);

    expect(validated.NODE_ENV).toBe(Environment.Development);
    expect(validated.PORT).toBe(3000);
    expect(validated.API_PREFIX).toBe('api/v1');
    expect(validated.LOG_LEVEL).toBe(LogLevel.Info);
    expect(validated.CORS_ORIGIN).toBe('*');
  });

  it('should throw when in production and CORS_ORIGIN is wildcard *', () => {
    const rawConfig = {
      NODE_ENV: 'production',
      CORS_ORIGIN: '*',
    };

    expect(() => validateEnvironment(rawConfig)).toThrow(
      /In production \(NODE_ENV=production\), CORS_ORIGIN cannot be '\*'/,
    );
  });

  it('should allow valid production configuration with explicit CORS origin', () => {
    const rawConfig = {
      NODE_ENV: 'production',
      CORS_ORIGIN: 'https://recruitment.example.com',
      PORT: '8080',
    };

    const validated = validateEnvironment(rawConfig);

    expect(validated.NODE_ENV).toBe(Environment.Production);
    expect(validated.CORS_ORIGIN).toBe('https://recruitment.example.com');
    expect(validated.PORT).toBe(8080);
  });

  it('should throw an informative error when PORT is non-numeric', () => {
    const rawConfig = {
      PORT: 'invalid-port-string',
    };

    expect(() => validateEnvironment(rawConfig)).toThrow(
      /Configuration validation failed at application startup/,
    );
  });

  it('should throw when PORT is out of range (> 65535)', () => {
    const rawConfig = {
      PORT: '70000',
    };

    expect(() => validateEnvironment(rawConfig)).toThrow(/PORT must be <= 65535/);
  });

  it('should throw when NODE_ENV is an unpermitted string', () => {
    const rawConfig = {
      NODE_ENV: 'staging_unknown',
    };

    expect(() => validateEnvironment(rawConfig)).toThrow(
      /NODE_ENV must be one of: development, production, test/,
    );
  });

  it('should throw when LOG_LEVEL is unpermitted', () => {
    const rawConfig = {
      LOG_LEVEL: 'silly',
    };

    expect(() => validateEnvironment(rawConfig)).toThrow(
      /LOG_LEVEL must be one of: error, warn, info, debug, verbose/,
    );
  });
});
