import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes.enum';

/**
 * Standard API error response payload returned to clients.
 */
export interface ErrorResponsePayload {
  statusCode: number;
  errorCode: string;
  message: string | string[];
  timestamp: string;
  path: string;
  correlationId: string;
  details?: Record<string, unknown> | unknown[];
}

/**
 * Base Application Error.
 * All domain and application errors should extend AppError to guarantee
 * consistent status codes and machine-readable error codes.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly details?: Record<string, unknown> | unknown[];

  constructor(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    details?: Record<string, unknown> | unknown[],
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Thrown when incoming request data fails domain or structural validation.
 */
export class ValidationAppError extends AppError {
  constructor(message: string, details?: unknown[]) {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED, details);
  }
}

/**
 * Thrown when a requested resource does not exist.
 */
export class NotFoundAppError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const msg = identifier
      ? `${resource} with identifier '${identifier}' was not found`
      : `${resource} was not found`;
    super(msg, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND);
  }
}
