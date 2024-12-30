import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { MetricsModule } from '@/metrics/metrics.module';
import { AsyncContextMiddleware } from '@/shared/middleware/async-context.middleware';
import { CorrelationIdMiddleware } from '@/shared/middleware/correlation-id.middleware';
import { SharedModule } from '@/shared/shared.module';
import { TransactionModule } from '@/transactions/transaction.module';
import { UserModule } from '@/users/user.module';

@Module({
  imports: [SharedModule, UserModule, TransactionModule, MetricsModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
    consumer.apply(AsyncContextMiddleware).forRoutes('*');
  }
}
