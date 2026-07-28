import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorBody: {
      statusCode: number;
      message: string;
      errors: string[] | null;
      timestamp: string;
      path: string;
    } = {
      statusCode: status,
      message: '',
      errors: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (typeof exceptionResponse === 'string') {
      errorBody.message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const resp = exceptionResponse as Record<string, any>;
      errorBody.message = resp.message || exception.message;

      if (Array.isArray(resp.message)) {
        errorBody.errors = resp.message;
        errorBody.message = 'Validation failed';
      } else if (resp.errors) {
        errorBody.errors = resp.errors;
      }
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception.stack,
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${status} - ${errorBody.message}`);
    }

    response.status(status).json(errorBody);
  }
}
