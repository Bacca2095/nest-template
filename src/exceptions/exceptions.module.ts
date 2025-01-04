import { Module } from '@nestjs/common';

import { AppExceptionsHandler } from './exceptions/app-exceptions.handler';
import { AxiosExceptionsHandler } from './exceptions/axios-exceptions.handler';
import { PrismaExceptionsHandler } from './exceptions/prisma-exceptions.handler';
import { HandleExceptionsService } from './providers/handle-exceptions.service';

@Module({
  providers: [
    PrismaExceptionsHandler,
    AppExceptionsHandler,
    AxiosExceptionsHandler,
    HandleExceptionsService,
    {
      provide: 'EXCEPTION_HANDLERS',
      useFactory: (
        prismaHandler: PrismaExceptionsHandler,
        appHandler: AppExceptionsHandler,
        axiosHandler: AxiosExceptionsHandler,
      ) => [prismaHandler, appHandler, axiosHandler],
      inject: [
        PrismaExceptionsHandler,
        AppExceptionsHandler,
        AxiosExceptionsHandler,
      ],
    },
  ],
  exports: [HandleExceptionsService],
})
export class ExceptionsModule {}
