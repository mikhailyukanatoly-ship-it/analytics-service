import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface IError {
  message: string;
  code_error?: string | number | null;
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter<HttpException> {
  private logger = new Logger(this.constructor.name);
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    const request: Request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorResponse = exception instanceof HttpException ? exception.getResponse() : null;
    const message: IError =
      typeof errorResponse === 'object' && errorResponse !== null
        ? (errorResponse as IError)
        : { message: (exception as Error).message ?? 'Internal server error', code_error: null };

    const responseData = {
      success: false,
      error: message.message,
      details: message.code_error || status.toString(),
    };

    this.logMessage(request, message, status, exception);

    response.status(status).json(responseData);
  }

  private logMessage(request: Request, message: IError, status: number, exception: HttpException) {
    const logPayload = {
      path: request.path,
      method: request.method,
      query: request.query,
      body: request.body,
      status,
      error: message.message,
    };

    if (status >= 500) {
      this.logger.error(logPayload, exception.stack);
    } else {
      this.logger.warn(logPayload);
    }
  }
}
