import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

/**
 * LoggingInterceptor provides controller-handler level observability.
 * Useful for debugging route latency and tracing handler execution.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler().name;
    const controller = context.getClass().name;
    const correlationId = request?.correlationId || 'unknown';
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - now;
        this.logger.debug(
          `[${correlationId}] Handled by ${controller}.${handler} in ${elapsed}ms`,
        );
      }),
    );
  }
}
