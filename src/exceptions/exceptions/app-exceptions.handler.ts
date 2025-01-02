import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { ExceptionHandler } from './interfaces/exception-handler.interface';
import { AppErrorCodesEnum } from '../enums/app-error-codes.enum';
import { AppError } from '../errors/app.error';

export class AppExceptionsHandler extends ExceptionHandler {
  private readonly logger = new Logger(AppExceptionsHandler.name);

  isType(error: unknown): Record<string, unknown> | null {
    if (error instanceof AppError) {
      const errorData = {
        type: 'app-error',
        message: error.message,
        code: error.code,
        stackTrace: JSON.stringify(this.getStackTrace(error as AppError)),
      };
      this.logger.error(errorData);
      return errorData;
    }
    return null;
  }

  execute(error: AppError): never {
    switch (error.message) {
      case AppErrorCodesEnum.USER_EXIST:
        throw new ConflictException('User already in use');
      case AppErrorCodesEnum.INVALID_CREDENTIALS:
        throw new BadRequestException('Invalid credentials');
      default:
        throw new InternalServerErrorException(
          `An unexpected error occurred: ${error.code}`,
        );
    }
  }
}
