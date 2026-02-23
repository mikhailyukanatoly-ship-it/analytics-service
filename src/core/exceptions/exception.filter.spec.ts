import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { AllExceptionFilter } from './exception.filter';

describe('AllExceptionFilter', () => {
  let filter: AllExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      path: '/test',
      method: 'GET',
      query: {},
      body: {},
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;

    (filter as any).logger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
  });

  describe('catch', () => {
    it('should handle BadRequestException and return proper response', () => {
      const exception = new BadRequestException('Invalid input');
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input',
        details: '400',
      });
    });

    it('should handle exception with custom error structure', () => {
      const exception = new BadRequestException({
        message: 'Custom error',
        code_error: 'ERR_001',
      });
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Custom error',
        details: 'ERR_001',
      });
    });

    it('should handle InternalServerErrorException', () => {
      const exception = new InternalServerErrorException('Server error');
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error',
        details: '500',
      });
    });

    it('should handle non-HttpException errors', () => {
      const exception = new Error('Unknown error') as any;
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown error',
        details: '500',
      });
    });

    it('should log error for 5xx status codes', () => {
      const loggerErrorSpy = jest.spyOn((filter as any).logger, 'error');
      const exception = new InternalServerErrorException('Server error');
      filter.catch(exception, mockHost);

      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should log warning for 4xx status codes', () => {
      const loggerWarnSpy = jest.spyOn((filter as any).logger, 'warn');
      const exception = new BadRequestException('Bad request');
      filter.catch(exception, mockHost);

      expect(loggerWarnSpy).toHaveBeenCalled();
    });

    it('should include request details in log', () => {
      const loggerWarnSpy = jest.spyOn((filter as any).logger, 'warn');
      mockRequest.path = '/api/test';
      mockRequest.method = 'POST';
      mockRequest.query = { id: '1' };
      mockRequest.body = { data: 'test' };

      const exception = new BadRequestException('Validation failed');
      filter.catch(exception, mockHost);

      expect(loggerWarnSpy).toHaveBeenCalledWith({
        path: '/api/test',
        method: 'POST',
        query: { id: '1' },
        body: { data: 'test' },
        status: 400,
        error: 'Validation failed',
      });
    });
  });
});
