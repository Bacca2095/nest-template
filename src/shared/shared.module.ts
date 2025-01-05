import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { ExceptionsModule } from '@/exceptions/exceptions.module';
import { AuthModule } from 'src/auth/auth.module';

import { HttpExceptionFilter } from './filters/http-exception.filter';
import { CustomLoggerModule } from './modules/custom-logger.module';
import { AsyncLocalStorageService } from './providers/async-local-storage.service';
import { OpenSearchService } from './providers/opensearch.service';
import { PrismaService } from './providers/prisma.service';

@Global()
@Module({
  imports: [
    CustomLoggerModule,
    ExceptionsModule,
    AuthModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    PrismaService,
    AsyncLocalStorageService,
    OpenSearchService,
  ],
  exports: [PrismaService, AsyncLocalStorageService, OpenSearchService],
})
export class SharedModule {}
