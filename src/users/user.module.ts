import { Module } from '@nestjs/common';

import { UserService } from './providers/user.service';

@Module({
  imports: [],
  controllers: [],
  providers: [UserService],
})
export class UserModule {}
