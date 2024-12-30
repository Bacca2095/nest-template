import { OmitType } from '@nestjs/swagger';

import { UserWithPasswordDto } from './user.dto';

export class CreateUserDto extends OmitType(UserWithPasswordDto, [
  'createdAt',
  'deletedAt',
  'updatedAt',
  'id',
]) {}
