import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { TransactionDto } from '../dto/transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(private readonly db: PrismaService) {}

  async createTransaction(data: CreateTransactionDto): Promise<TransactionDto> {
    return this.db.transaction.create({ data });
  }

  async getTransactions(): Promise<TransactionDto[]> {
    return this.db.transaction.findMany();
  }

  async getTransactionById(id: number): Promise<TransactionDto> {
    return this.db.transaction.findUnique({ where: { id } });
  }

  async updateTransaction(
    id: number,
    data: UpdateTransactionDto,
  ): Promise<TransactionDto> {
    return this.db.transaction.update({ where: { id }, data });
  }

  async deleteTransaction(id: number): Promise<TransactionDto> {
    return this.db.transaction.delete({ where: { id } });
  }
}
