import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/database/prisma.service';
import { HealthService } from '../../src/health/health.service';

describe('HealthService', () => {
  let service: HealthService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      checkHealth: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'app.nodeEnv') return 'test';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prismaService = module.get(PrismaService);
  });

  it('should return decoupled application health and connected database health when PostgreSQL is reachable', async () => {
    prismaService.checkHealth.mockResolvedValue({
      status: 'connected',
      latencyMs: 3,
    });

    const health = await service.getHealth();

    // Application health is explicitly verified
    expect(health.application.status).toBe('ok');
    expect(health.application.environment).toBe('test');
    expect(typeof health.application.uptimeSeconds).toBe('number');
    expect(typeof health.application.timestamp).toBe('string');
    expect(health.application.version).toBeDefined();

    // Database health is separate and reflects actual check
    expect(health.database.status).toBe('connected');
    expect(health.database.latencyMs).toBe(3);
  });

  it('should report application as ok but database as disconnected when database ping fails', async () => {
    prismaService.checkHealth.mockResolvedValue({
      status: 'disconnected',
      error: 'Connection refused',
    });

    const health = await service.getHealth();

    // Application status remains ok because HTTP server is functional
    expect(health.application.status).toBe('ok');

    // Database status explicitly indicates failure without false positive
    expect(health.database.status).toBe('disconnected');
    expect(health.database.error).toBe('Connection refused');
  });

  it('should report database as unconfigured when connection string is absent', async () => {
    prismaService.checkHealth.mockResolvedValue({
      status: 'unconfigured',
    });

    const health = await service.getHealth();

    expect(health.application.status).toBe('ok');
    expect(health.database.status).toBe('unconfigured');
  });
});
