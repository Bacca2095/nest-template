import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { UserDto } from '../dto/user.dto';
import { UserService } from '../providers/user.service';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('jwt')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOkResponse({ type: UserDto, isArray: true })
  async get(): Promise<UserDto[]> {
    return this.userService.get();
  }

  @Get(':id')
  @ApiOkResponse({ type: UserDto })
  async getById(id: number): Promise<UserDto> {
    return this.userService.getById(id);
  }
}
