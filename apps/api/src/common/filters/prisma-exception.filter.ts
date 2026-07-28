import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[])?.join(', ');
        message = `Unique constraint violation on ${target || 'field'}`;
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;
      }
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        message = 'Foreign key constraint failed';
        break;
      }
      case 'P2014': {
        status = HttpStatus.BAD_REQUEST;
        message = 'Required relation violation';
        break;
      }
      case 'P2001': {
        status = HttpStatus.NOT_FOUND;
        message = 'Record does not exist';
        break;
      }
      default: {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = `Database error: ${exception.message}`;
        break;
      }
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception.stack,
    );

    response.status(status).json({
      statusCode: status,
      message,
      error: 'Database Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
