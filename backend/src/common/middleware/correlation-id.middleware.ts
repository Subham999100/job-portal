import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { APP_CONSTANTS } from '../constants/app.constants';

// Extend Express Request interface to include correlationId
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

/**
 * CorrelationIdMiddleware ensures every inbound HTTP request has a unique
 * request correlation identifier.
 *
 * If the upstream client supplies an X-Correlation-Id header, that ID is
 * honored and propagated. Otherwise, a cryptographically secure UUIDv4 is generated.
 *
 * The correlation ID is attached to the request object and set as a header
 * on the outgoing response.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incomingHeader = req.headers[APP_CONSTANTS.CORRELATION_ID_HEADER];
    const correlationId =
      typeof incomingHeader === 'string' && incomingHeader.trim() !== ''
        ? incomingHeader.trim()
        : randomUUID();

    req.correlationId = correlationId;
    res.setHeader(APP_CONSTANTS.CORRELATION_ID_HEADER, correlationId);

    next();
  }
}
