import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateServerDto } from '../dto/create-server.dto';
import { ResetServerDto } from '../dto/reset-server.dto';
import { ContaboService } from '../providers/contabo.service';

@ApiTags('Contabo')
@Controller('contabo')
export class ContaboController {
  constructor(private readonly contaboService: ContaboService) {}

  @Post()
  async create(@Body() dto: CreateServerDto) {
    return this.contaboService.createServer(dto);
  }

  @Get()
  async getServerList() {
    return this.contaboService.getServerList();
  }

  @Get('images')
  async getImagesList() {
    return this.contaboService.getImagesList();
  }

  @Get('/:id')
  async getServerDetails(@Param('id') id: number) {
    return this.contaboService.connectSsh(id);
  }

  @Put('/:id')
  async resetServer(@Param('id') id: number, @Body() dto: ResetServerDto) {
    return this.contaboService.resetServer(id, dto);
  }
}
