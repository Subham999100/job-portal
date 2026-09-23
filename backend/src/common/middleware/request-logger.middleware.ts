import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { APP_CONSTANTS } from '../constants/app.constants';

/**
 * RequestLoggerMiddleware provides structured HTTP access logging.
 *
 * It records the inception and conclusion of every request, capturing
 * duration, status code, method, path, and the correlation ID for
 * request correlation and structured logging.
 *
 * Security Guarantee:
 * Headers containing authorization credentials, bearer tokens, or session
 * cookies are stripped/redacted before writing to logs.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || 'unknown';

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const correlationId =
        req.correlationId ||
        (req.headers[APP_CONSTANTS.CORRELATION_ID_HEADER] as string) ||
        'unknown';

      const logMessage = `[${correlationId}] ${method} ${originalUrl} ${statusCode} +${duration}ms - ${userAgent} ${ip}`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
