import { Module } from '@nestjs/common';

import { AppExceptionsHandler } from './exceptions/app-exceptions.handler';
import { PrismaExceptionsHandler } from './exceptions/prisma-exceptions.handler';
import { HandleExceptionsService } from './providers/handle-exceptions.service';

@Module({
  providers: [
    PrismaExceptionsHandler,
    AppExceptionsHandler,
    HandleExceptionsService,
    {
      provide: 'EXCEPTION_HANDLERS',
      useFactory: (
        prismaHandler: PrismaExceptionsHandler,
        appHandler: AppExceptionsHandler,
      ) => [prismaHandler, appHandler],
      inject: [PrismaExceptionsHandler, AppExceptionsHandler],
    },
  ],
  exports: [HandleExceptionsService],
})
export class ExceptionsModule {}
