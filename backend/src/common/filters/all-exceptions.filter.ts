import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { APP_CONSTANTS } from '../constants/app.constants';
import { ErrorResponsePayload } from '../errors/app-error';
import { ErrorCode } from '../errors/error-codes.enum';

/**
 * AllExceptionsFilter catches any unhandled exception that was not explicitly
 * wrapped in an HttpException.
 *
 * Security Guarantee:
 * Never exposes stack traces, internal database connection strings, or system
 * internals to API consumers in production environments. All raw error data
 * is recorded server-side tagged with the request's correlation ID.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId =
      (request.headers[APP_CONSTANTS.CORRELATION_ID_HEADER] as string) ||
      (request as unknown as { correlationId?: string }).correlationId ||
      'unknown-correlation-id';

    const isProduction =
      this.configService.get<string>('app.nodeEnv') === 'production';

    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionMessage =
      exception instanceof Error ? exception.message : 'Unknown exception';
    const exceptionStack =
      exception instanceof Error ? exception.stack : undefined;

    // Secure server-side logging of raw exception
    this.logger.error(
      `[${correlationId}] Unhandled Exception on ${request.method} ${request.url}: ${exceptionMessage}`,
      exceptionStack,
    );

    // In production, mask internal details to avoid leaking infrastructure context
    const clientMessage = isProduction
      ? 'An unexpected internal server error occurred. Please contact support with the correlation ID.'
      : exceptionMessage;

    const errorPayload: ErrorResponsePayload = {
      statusCode: status,
      errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      message: clientMessage,
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
      correlationId,
      ...(!isProduction && exceptionStack ? { details: [exceptionStack] } : {}),
    };

    response.status(status).json(errorPayload);
  }
}
