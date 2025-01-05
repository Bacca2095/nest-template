import { BullAdapter } from '@bull-board/api/bullAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

import { MetricsModule } from '@/metrics/metrics.module';
import { SshModule } from '@/ssh/ssh.module';

import { ContaboController } from './controllers/contabo.controller';
import { InstanceSyncProcessor } from './processors/instance-sync.processor';
import { ContaboAuthService } from './providers/contabo-auth.service';
import { ContaboImageService } from './providers/contabo-image.service';
import { ContaboInstanceService } from './providers/contabo-instance.service';
import { ContaboSecretService } from './providers/contabo-secret.service';

@Module({
  imports: [
    HttpModule,
    SshModule,
    BullModule.registerQueue({
      name: 'sync',
    }),
    BullModule.registerQueue({
      name: 'ssh',
    }),
    BullBoardModule.forFeature({
      name: 'ssh',
      adapter: BullAdapter,
    }),
    MetricsModule,
  ],
  controllers: [ContaboController],
  providers: [
    ContaboAuthService,
    ContaboImageService,
    ContaboInstanceService,
    ContaboSecretService,
    InstanceSyncProcessor,
  ],
})
export class ContaboModule {}
