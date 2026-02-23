import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

export const TIMEOUT_KEY = 'timeout';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly defaultTimeout: number = 30000,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Читаем timeout из metadata контроллера/метода
    const contextTimeout = this.reflector.getAllAndOverride<number>(TIMEOUT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const timeoutMs = contextTimeout ?? this.defaultTimeout;

    return next.handle().pipe(
      timeout(timeoutMs),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () => new RequestTimeoutException(`Request timeout after ${timeoutMs}ms`),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
