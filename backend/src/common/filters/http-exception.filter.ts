import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { APP_CONSTANTS } from '../constants/app.constants';
import { ErrorResponsePayload } from '../errors/app-error';

/**
 * HttpExceptionFilter intercepts all instances of NestJS HttpException
 * and formats them into the standard error payload shape.
 *
 * This ensures API consumers receive a predictable error format regardless
 * of which module, controller, or pipe triggered the exception.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const correlationId =
      (request.headers[APP_CONSTANTS.CORRELATION_ID_HEADER] as string) ||
      (request as unknown as { correlationId?: string }).correlationId ||
      'unknown-correlation-id';

    let message: string | string[] = exception.message;
    let errorCode = `HTTP_${status}`;
    let details: Record<string, unknown> | unknown[] | undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const respObj = exceptionResponse as Record<string, unknown>;
      if (respObj.message) {
        message = respObj.message as string | string[];
      }
      if (respObj.error) {
        errorCode = String(respObj.error).toUpperCase().replace(/\s+/g, '_');
      }
      if (respObj.details) {
        details = respObj.details as Record<string, unknown> | unknown[];
      }
    }

    const errorPayload: ErrorResponsePayload = {
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
      correlationId,
      ...(details ? { details } : {}),
    };

    // Warn on client errors (4xx), log error on server errors (5xx)
    if (status >= 500) {
      this.logger.error(
        `[${correlationId}] ${request.method} ${request.url} - ${status} Error: ${JSON.stringify(message)}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `[${correlationId}] ${request.method} ${request.url} - ${status} Client Warning: ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json(errorPayload);
  }
}
