import { Injectable } from '@nestjs/common';
import { hash } from 'argon2';

import { PrismaService } from '@/shared/providers/prisma.service';

import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly db: PrismaService) {}

  async get() {
    return this.db.user.findMany({ omit: { password: true } });
  }

  async getById(id: number) {
    return this.db.user.findUniqueOrThrow({
      where: { id },
      omit: { password: true },
    });
  }

  async getByEmail(email: string) {
    return this.db.user.findUniqueOrThrow({ where: { email } });
  }

  async create(data: CreateUserDto) {
    const { password } = data;

    const hashedPassword = await hash(password);

    return this.db.user.create({ data: { ...data, password: hashedPassword } });
  }

  async update(id: number, data: CreateUserDto) {
    return this.db.user.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.db.user.delete({ where: { id } });
  }
}
