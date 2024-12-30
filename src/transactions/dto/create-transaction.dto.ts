import { OmitType } from '@nestjs/swagger';

import { TransactionDto } from './transaction.dto';

export class CreateTransactionDto extends OmitType(TransactionDto, [
  'createdAt',
  'deletedAt',
  'updatedAt',
  'id',
  'userId',
]) {}
