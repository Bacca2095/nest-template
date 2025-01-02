import { Global, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';

@Global()
@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: () => ({
        pinoHttp: {
          transport: {
            target: 'pino-pretty',
            options: {
              messageKey: 'message',
              colorize: true,
              singleLine: true,
              translateTime: 'yyyy-mm-dd HH:MM:ss',
              ignore: 'pid,hostname,res',
              customPrettifiers: {},
            },
          },
          messageKey: 'message',
          customProps: (req: unknown) => ({
            correlationId: req[CORRELATION_ID_HEADER],
          }),
          autoLogging: true,
          level: 'info',
        },
      }),
    }),
  ],
  exports: [LoggerModule],
})
export class CustomLoggerModule {}
