import {
  BadRequestException,
  Injectable,
  ValidationError,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';

/**
 * PlatformValidationPipe enforces strict request payload validation.
 *
 * Capabilities:
 * - whitelist: true (strips any property not declared on the DTO class)
 * - forbidNonWhitelisted: true (throws an error if unexpected properties are sent)
 * - transform: true (automatically transforms incoming plain objects into typed DTO instances)
 * - custom exceptionFactory: returns structured error details with offending fields and reasons
 */
@Injectable()
export class PlatformValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]): BadRequestException => {
        const formatErrors = (errs: ValidationError[]): unknown[] => {
          return errs.map((err) => ({
            field: err.property,
            value: err.value,
            constraints: err.constraints
              ? Object.values(err.constraints)
              : ['Validation failed'],
            ...(err.children && err.children.length > 0
              ? { children: formatErrors(err.children) }
              : {}),
          }));
        };

        const formatted = formatErrors(errors);
        return new BadRequestException({
          message: 'Request payload validation failed',
          error: 'VALIDATION_FAILED',
          details: formatted,
        });
      },
    });
  }
}
