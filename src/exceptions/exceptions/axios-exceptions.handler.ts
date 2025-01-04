import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';

import { ExceptionHandler } from './interfaces/exception-handler.interface';

export class AxiosExceptionsHandler extends ExceptionHandler {
  private readonly logger = new Logger(AxiosExceptionsHandler.name);

  isType(error: unknown): Record<string, unknown> | null {
    if (error instanceof AxiosError) {
      const errorData = {
        type: 'axios-error',
        message: error.message,
        code: error.code,
        cause: error.cause,
        stackTrace: JSON.stringify(this.getStackTrace(error as AxiosError)),
      };
      this.logger.error(errorData);
      return errorData;
    }
    return null;
  }

  execute(error: AxiosError): never {
    throw new HttpException(
      error.response?.data ||
        'An unexpected error occurred in request: ${error.code}',
      error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
