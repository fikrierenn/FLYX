/**
 * Global Hata Filtresi
 * =====================
 * Tum yakalanmamis hatalari yapisal JSON yanitina donusturur.
 * Correlation ID ile hata takibi saglar.
 */

import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = crypto.randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object') {
        message = (exResponse as any).message || message;
        details = (exResponse as any).errors || undefined;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Loglama
    this.logger.error(
      `[${correlationId}] ${request.method} ${request.url} → ${status}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      message,
      details,
      correlationId,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
