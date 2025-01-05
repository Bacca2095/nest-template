import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreateServerDto } from '../dto/create-server.dto';
import { ResetServerDto } from '../dto/reset-server.dto';
import { ContaboImageService } from '../providers/contabo-image.service';
import { ContaboInstanceService } from '../providers/contabo-instance.service';

@ApiTags('Contabo')
@Controller('contabo')
export class ContaboController {
  constructor(
    private readonly serverService: ContaboInstanceService,
    private readonly imageService: ContaboImageService,
  ) {}

  @Post('instances')
  async create(@Body() dto: CreateServerDto) {
    return this.serverService.createServer(dto);
  }

  @Get('instances')
  async getServerList() {
    return this.serverService.getServerList();
  }

  @Get('images')
  async getImagesList() {
    return this.imageService.getImagesList();
  }

  @Put('instances/:id/reset')
  async resetServer(@Param('id') id: number, @Body() dto: ResetServerDto) {
    return this.serverService.resetServer(id, dto);
  }

  @Post('instances/sync')
  async syncServer() {
    return this.serverService.syncServers();
  }
}
