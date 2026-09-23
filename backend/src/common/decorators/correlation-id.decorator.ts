import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { APP_CONSTANTS } from '../constants/app.constants';

/**
 * Controller parameter decorator to extract the active correlation ID.
 *
 * Example:
 *   @Get()
 *   findSomething(@CorrelationId() correlationId: string) { ... }
 */
export const CorrelationId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (
      request.correlationId ||
      (request.headers[APP_CONSTANTS.CORRELATION_ID_HEADER] as string) ||
      'unknown'
    );
  },
);
