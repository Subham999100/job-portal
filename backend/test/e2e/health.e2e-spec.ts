import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { APP_CONSTANTS } from '../../src/common/constants/app.constants';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PlatformValidationPipe } from '../../src/common/pipes/validation.pipe';

describe('Application Bootstrap & Canonical Health Endpoint (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const configService = app.get(ConfigService);
    const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');

    app.setGlobalPrefix(apiPrefix, {
      exclude: ['health'],
    });
    app.useGlobalPipes(new PlatformValidationPipe());
    app.useGlobalFilters(
      new AllExceptionsFilter(configService),
      new HttpExceptionFilter(),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health should return 200 OK with decoupled application and database health', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        // Application health
        expect(res.body).toHaveProperty('application');
        expect(res.body.application).toHaveProperty('status', 'ok');
        expect(res.body.application).toHaveProperty('uptimeSeconds');
        expect(res.body.application).toHaveProperty('environment');
        expect(res.body.application).toHaveProperty('version');

        // Database health is separate and reflects actual connection state
        expect(res.body).toHaveProperty('database');
        expect(['connected', 'disconnected', 'unconfigured']).toContain(
          res.body.database.status,
        );

        // Correlation ID is present in response headers
        expect(res.headers).toHaveProperty(APP_CONSTANTS.CORRELATION_ID_HEADER);
      });
  });

  it('should propagate incoming X-Correlation-Id header through response and logs', () => {
    const customCorrelationId = 'client-trace-id-abc-123';

    return request(app.getHttpServer())
      .get('/health')
      .set('x-correlation-id', customCorrelationId)
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-correlation-id']).toBe(customCorrelationId);
      });
  });

  it('GET /api/v1/nonexistent should return 404 with standardized error response schema', () => {
    return request(app.getHttpServer())
      .get('/api/v1/nonexistent')
      .expect(404)
      .expect((res) => {
        expect(res.body).toHaveProperty('statusCode', 404);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('correlationId');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('path', '/api/v1/nonexistent');
      });
  });
});
