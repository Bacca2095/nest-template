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

  isType(error: unknown): error is AppError {
    return error instanceof AppError;
  }

  execute(error: AppError): never {
    this.logger.error({
      type: 'AppError',
      message: error.message,
      code: error.code,
      stackTrace: this.getStackTrace(error),
    });

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
