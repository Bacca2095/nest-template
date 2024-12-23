import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { UserModule } from './users/user.module';
import { TransactionModule } from './transactions/transaction.module';

@Module({
  imports: [SharedModule, UserModule, TransactionModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
