import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HealthResponse, HealthService } from './health.service';

/**
 * HealthController exposes the canonical application health probe.
 *
 * Endpoint:
 * - GET /health: Reports decoupled application status and dependency status.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getHealth(): Promise<HealthResponse> {
    return this.healthService.getHealth();
  }
}
