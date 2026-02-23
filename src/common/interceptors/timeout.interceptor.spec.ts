import { ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError, TimeoutError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { TimeoutInterceptor, TIMEOUT_KEY } from './timeout.interceptor';

describe('TimeoutInterceptor', () => {
  let interceptor: TimeoutInterceptor;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    reflector = new Reflector();
    interceptor = new TimeoutInterceptor(reflector, 1000);

    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;
  });

  describe('intercept', () => {
    it('should allow request to complete within timeout', (done) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
      mockCallHandler.handle = jest.fn().mockReturnValue(of('result'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (value) => {
          expect(value).toBe('result');
          done();
        },
      });
    });

    it('should use custom timeout from metadata', (done) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(500);
      mockCallHandler.handle = jest.fn().mockReturnValue(of('result'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (value) => {
          expect(value).toBe('result');
          expect(reflector.getAllAndOverride).toHaveBeenCalledWith(TIMEOUT_KEY, [
            mockExecutionContext.getHandler(),
            mockExecutionContext.getClass(),
          ]);
          done();
        },
      });
    });

    it('should throw TimeoutError for requests exceeding timeout', (done) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(100);
      mockCallHandler.handle = jest.fn().mockReturnValue(of('result').pipe(delay(200)));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(RequestTimeoutException);
          expect(err.message).toContain('Request timeout after 100ms');
          done();
        },
      });
    });

    it('should use default timeout when no metadata is set', (done) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
      mockCallHandler.handle = jest.fn().mockReturnValue(of('result'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (value) => {
          expect(value).toBe('result');
          done();
        },
      });
    });

    it('should propagate non-timeout errors', (done) => {
      const testError = new Error('Test error');
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => testError));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: (err) => {
          expect(err).toBe(testError);
          expect(err).not.toBeInstanceOf(RequestTimeoutException);
          done();
        },
      });
    });

    it('should convert TimeoutError to RequestTimeoutException', (done) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(50);
      const timeoutError = new TimeoutError();
      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => timeoutError));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(RequestTimeoutException);
          expect(err.message).toContain('Request timeout after 50ms');
          done();
        },
      });
    });

    it('should read timeout from handler and class metadata', () => {
      const getAllAndOverrideSpy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(2000);
      mockCallHandler.handle = jest.fn().mockReturnValue(of('result'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe();

      expect(getAllAndOverrideSpy).toHaveBeenCalledWith(TIMEOUT_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });
  });
});
