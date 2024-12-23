import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TransactionService } from '../providers/transaction.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { TransactionDto } from '../dto/transaction.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiCreatedResponse({ type: TransactionDto })
  async createTransaction(
    @Body() data: CreateTransactionDto,
  ): Promise<TransactionDto> {
    return this.transactionService.createTransaction(data);
  }

  @Get()
  @ApiOkResponse({ type: [TransactionDto] })
  async getTransactions(): Promise<TransactionDto[]> {
    return this.transactionService.getTransactions();
  }

  @Get(':id')
  @ApiOkResponse({ type: TransactionDto })
  async getTransactionById(@Param('id') id: number): Promise<TransactionDto> {
    return this.transactionService.getTransactionById(id);
  }

  @Put(':id')
  @ApiOkResponse({ type: TransactionDto })
  async updateTransaction(
    @Param('id') id: number,
    @Body() data: UpdateTransactionDto,
  ): Promise<TransactionDto> {
    return this.transactionService.updateTransaction(id, data);
  }

  @Delete(':id')
  @ApiOkResponse({ type: TransactionDto })
  async deleteTransaction(@Param('id') id: number): Promise<TransactionDto> {
    return this.transactionService.deleteTransaction(id);
  }
}
