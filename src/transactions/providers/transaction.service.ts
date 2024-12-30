import { Injectable } from '@nestjs/common';

import { HandleExceptions } from '@/exceptions/decorators/handle-exceptions.decorator';
import { AsyncLocalStorageService } from '@/shared/providers/async-local-storage.service';
import { PrismaService } from '@/shared/providers/prisma.service';

import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { TransactionDto } from '../dto/transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(
    private readonly db: PrismaService,
    private readonly als: AsyncLocalStorageService,
  ) {}

  @HandleExceptions()
  async create(data: CreateTransactionDto): Promise<TransactionDto> {
    const userId = this.als.get<number>('userId');
    return this.db.transaction.create({ data: { ...data, userId } });
  }

  @HandleExceptions()
  async get(): Promise<TransactionDto[]> {
    const userId = this.als.get<number>('userId');
    return this.db.transaction.findMany({ where: { userId } });
  }

  @HandleExceptions()
  async getById(id: number): Promise<TransactionDto> {
    const userId = this.als.get<number>('userId');
    return this.db.transaction.findUniqueOrThrow({ where: { id, userId } });
  }

  @HandleExceptions()
  async update(
    id: number,
    data: UpdateTransactionDto,
  ): Promise<TransactionDto> {
    const userId = this.als.get<number>('userId');
    return this.db.transaction.update({ where: { id, userId }, data });
  }

  @HandleExceptions()
  async delete(id: number): Promise<TransactionDto> {
    const userId = this.als.get<number>('userId');
    return this.db.transaction.delete({ where: { id, userId } });
  }
}
