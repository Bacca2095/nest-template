import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { ContaboController } from './controllers/contabo.controller';
import { ContaboService } from './providers/contabo.service';

@Module({
  imports: [HttpModule],
  controllers: [ContaboController],
  providers: [ContaboService],
})
export class ContaboModule {}
