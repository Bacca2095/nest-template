import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { ExceptionHandler } from './interfaces/exception-handler.interface';

@Injectable()
export class PrismaExceptionsHandler extends ExceptionHandler {
  private readonly logger = new Logger(PrismaExceptionsHandler.name);

  isType(error: unknown): Record<string, unknown> | null {
    if (error instanceof PrismaClientKnownRequestError) {
      const errorData = {
        type: 'prisma-error',
        code: error.code,
        message: error.meta['cause'],
        model: error.meta['modelName'],
        stackTrace: JSON.stringify(
          this.getStackTrace(error as PrismaClientKnownRequestError),
        ),
      };

      this.logger.error(errorData);
      return errorData;
    }
    return null;
  }

  execute(error: PrismaClientKnownRequestError): never {
    switch (error.code) {
      case 'P2002':
        throw new ConflictException(
          `${error.meta['modelName']} already exists`,
        );
      case 'P2025':
        throw new NotFoundException(`${error.meta['modelName']} not found`);
      default:
        throw new Error('Unexpected Prisma error');
    }
  }
}
