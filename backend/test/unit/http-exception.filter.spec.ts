import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let mockRequest: {
    headers: Record<string, string>;
    url: string;
    method: string;
    originalUrl?: string;
  };
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      headers: {
        'x-correlation-id': 'test-correlation-uuid-1234',
      },
      url: '/test-route',
      originalUrl: '/test-route',
      method: 'GET',
    };

    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should catch HttpException and format uniform response payload with correlationId', () => {
    const exception = new HttpException('Resource not found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Resource not found',
        correlationId: 'test-correlation-uuid-1234',
        path: '/test-route',
      }),
    );
  });

  it('should capture structured object exceptions correctly', () => {
    const exception = new HttpException(
      {
        message: 'Payload invalid',
        error: 'VALIDATION_FAILED',
        details: [{ field: 'email', reason: 'must be valid' }],
      },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: 'VALIDATION_FAILED',
        message: 'Payload invalid',
        details: [{ field: 'email', reason: 'must be valid' }],
      }),
    );
  });
});
