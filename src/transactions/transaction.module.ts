import { Module } from '@nestjs/common';

import { TransactionController } from './controllers/transaction.controller';
import { TransactionService } from './providers/transaction.service';

@Module({
  imports: [],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
