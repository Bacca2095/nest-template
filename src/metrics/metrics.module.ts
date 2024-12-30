import { Module } from '@nestjs/common';

import { MetricsGateway } from './gateways/metrics.gateway';
import { MetricsService } from './providers/metrics.service';

@Module({
  imports: [],
  controllers: [],
  providers: [MetricsService, MetricsGateway],
  exports: [],
})
export class MetricsModule {}
