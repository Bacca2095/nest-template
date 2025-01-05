// ssh.module.ts
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { MetricsModule } from '@/metrics/metrics.module';

import { SshProcessor } from './processors/ssh.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ssh',
    }),
    MetricsModule,
  ],
  providers: [SshProcessor],
  exports: [],
})
export class SshModule {}
