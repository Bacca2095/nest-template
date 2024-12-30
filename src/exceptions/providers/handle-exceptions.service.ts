import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { ExceptionHandler } from '../exceptions/interfaces/exception-handler.interface';

@Injectable()
export class HandleExceptionsService implements OnModuleInit {
  private static instance: HandleExceptionsService;
  private readonly logger = new Logger('HandleExceptions');
  private handlers: ExceptionHandler[];

  constructor(private readonly moduleRef: ModuleRef) {}

  static getInstance(): HandleExceptionsService {
    if (!HandleExceptionsService.instance) {
      throw new Error(
        'HandleExceptionsService is not initialized. Ensure it is registered in a module.',
      );
    }
    return HandleExceptionsService.instance;
  }

  async onModuleInit() {
    HandleExceptionsService.instance = this;

    this.handlers = this.moduleRef.get<ExceptionHandler[]>(
      'EXCEPTION_HANDLERS',
      {
        strict: false,
      },
    );
  }

  handleErrors(error: unknown): never {
    this.logger.error(error);

    for (const handler of this.handlers) {
      if (handler.isType(error)) {
        handler.execute(error);
      }
    }

    if (error instanceof HttpException) {
      throw error;
    }

    throw new InternalServerErrorException('An unexpected error occurred');
  }
}
