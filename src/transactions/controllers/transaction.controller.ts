import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreateTransactionDto } from '@/transactions/dto/create-transaction.dto';
import { TransactionDto } from '@/transactions/dto/transaction.dto';
import { UpdateTransactionDto } from '@/transactions/dto/update-transaction.dto';
import { TransactionService } from '@/transactions/providers/transaction.service';

import { FilterTransactionDto } from '../dto/filter-transaction.dto';

@ApiTags('Transactions')
@Controller('transactions')
@ApiBearerAuth('jwt')
@UseGuards(AuthGuard('jwt'))
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiCreatedResponse({ type: TransactionDto })
  async create(@Body() data: CreateTransactionDto): Promise<TransactionDto> {
    return this.transactionService.create(data);
  }

  @Get()
  @ApiOkResponse({})
  async get(@Query() _query: FilterTransactionDto): Promise<TransactionDto[]> {
    return this.transactionService.get();
  }

  @Get(':id')
  @ApiOkResponse({ type: TransactionDto })
  async getById(@Param('id') id: number): Promise<TransactionDto> {
    return this.transactionService.getById(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: TransactionDto })
  async update(
    @Param('id') id: number,
    @Body() data: UpdateTransactionDto,
  ): Promise<TransactionDto> {
    return this.transactionService.update(id, data);
  }

  @Delete(':id')
  @ApiOkResponse({ type: TransactionDto })
  async delete(@Param('id') id: number): Promise<TransactionDto> {
    return this.transactionService.delete(id);
  }
}
