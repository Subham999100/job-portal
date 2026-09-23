import { APP_CONSTANTS } from '../constants/app.constants';

/**
 * Utility functions for log sanitization and formatting.
 */
export class LoggerUtil {
  /**
   * Recursively sanitize sensitive fields (passwords, tokens, keys)
   * from objects prior to serialization or logging.
   */
  static sanitize(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => LoggerUtil.sanitize(item));
    }

    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const isSensitive = APP_CONSTANTS.SENSITIVE_FIELD_NAMES.some((sensitive) =>
        key.toLowerCase().includes(sensitive.toLowerCase()),
      );

      if (isSensitive) {
        sanitizedObj[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitizedObj[key] = LoggerUtil.sanitize(value);
      } else {
        sanitizedObj[key] = value;
      }
    }

    return sanitizedObj;
  }
}
