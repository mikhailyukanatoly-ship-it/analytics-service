import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logger.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor<any>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;

  beforeEach(() => {
    interceptor = new LoggingInterceptor<any>();

    mockRequest = {
      method: 'GET',
      path: '/api/charts',
      body: { example: 'data' },
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;

    jest.spyOn(interceptor['logger'], 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('intercept', () => {
    it('should log incoming request with method and path', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of('result'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(interceptor['logger'].log).toHaveBeenCalledWith(
            '[GET] Request /api/charts body: {"example":"data"}',
          );
          done();
        },
      });
    });

    it('should log response with execution time', (done) => {
      const now = Date.now();
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 50);

      mockCallHandler.handle = jest.fn().mockReturnValue(of('result'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const logCalls = (interceptor['logger'].log as jest.Mock).mock.calls;
          const responseLogs = logCalls.filter((call) => call[0].includes('Response'));
          expect(responseLogs.length).toBe(1);
          expect(responseLogs[0][0]).toContain('[GET]');
          expect(responseLogs[0][0]).toContain('/api/charts');
          expect(responseLogs[0][0]).toContain('+50ms');
          done();
        },
      });
    });

    it('should handle POST request with body', (done) => {
      mockRequest.method = 'POST';
      mockRequest.body = { name: 'test', value: 123 };

      mockCallHandler.handle = jest.fn().mockReturnValue(of('result'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(interceptor['logger'].log).toHaveBeenCalledWith(
            '[POST] Request /api/charts body: {"name":"test","value":123}',
          );
          done();
        },
      });
    });

    it('should log empty body when request body is undefined', (done) => {
      mockRequest.body = undefined;

      mockCallHandler.handle = jest.fn().mockReturnValue(of('result'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(interceptor['logger'].log).toHaveBeenCalledWith(
            '[GET] Request /api/charts body: {}',
          );
          done();
        },
      });
    });

    it('should pass through the response value', (done) => {
      const responseValue = { id: 1, name: 'test' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseValue));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (value) => {
          expect(value).toEqual(responseValue);
          done();
        },
      });
    });

    it('should handle different HTTP methods', (done) => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      let completedTests = 0;

      methods.forEach((method) => {
        mockRequest.method = method;
        mockCallHandler.handle = jest.fn().mockReturnValue(of('result'));

        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: () => {
            expect(interceptor['logger'].log).toHaveBeenCalledWith(
              expect.stringContaining(`[${method}]`),
            );
            completedTests++;

            if (completedTests === methods.length) {
              done();
            }
          },
        });
      });
    });

    it('should handle errors from next handler', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => error));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          // Request log should still be called
          expect(interceptor['logger'].log).toHaveBeenCalledWith(
            expect.stringContaining('[GET] Request'),
          );
          done();
        },
      });
    });

    it('should log various request paths', (done) => {
      const paths = ['/api/charts', '/api/users', '/health', '/api/v1/data'];
      let completedTests = 0;

      paths.forEach((path) => {
        mockRequest.path = path;
        mockCallHandler.handle = jest.fn().mockReturnValue(of('result'));

        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          next: () => {
            expect(interceptor['logger'].log).toHaveBeenCalledWith(
              expect.stringContaining(`Request ${path}`),
            );
            completedTests++;

            if (completedTests === paths.length) {
              done();
            }
          },
        });
      });
    });

    it('should log complex request body', (done) => {
      mockRequest.body = {
        nested: {
          data: [1, 2, 3],
          flag: true,
          nullable: null,
        },
      };

      mockCallHandler.handle = jest.fn().mockReturnValue(of('result'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(interceptor['logger'].log).toHaveBeenCalledWith(
            expect.stringContaining('{"nested":{"data":[1,2,3],"flag":true,"nullable":null}}'),
          );
          done();
        },
      });
    });
  });
});
