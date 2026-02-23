import { Request } from 'express';
import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor<T> implements NestInterceptor<T, T> {
  private readonly logger = new Logger(this.constructor.name);

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const now = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();

    const body = request.body || {};

    this.logger.log(`[${request.method}] Request ${request.path} body: ${JSON.stringify(body)}`);

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`[${request.method}] Response ${request.path} +${Date.now() - now}ms`);
      }),
    );
  }
}
