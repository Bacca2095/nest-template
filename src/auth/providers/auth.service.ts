import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';

import { TokenResponseDto } from '@/auth/dto/token-response.dto';
import { HandleExceptions } from '@/exceptions/decorators/handle-exceptions.decorator';
import { AppErrorCodesEnum } from '@/exceptions/enums/app-error-codes.enum';
import { AppError } from '@/exceptions/errors/app.error';
import { environment } from '@/shared/env/environment';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UserService } from '@/users/providers/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  @HandleExceptions()
  async signIn(email: string, password: string): Promise<TokenResponseDto> {
    const user = await this.userService.getByEmail(email);

    const isPasswordValid = await verify(user.password, password);

    if (!isPasswordValid) {
      throw new AppError(AppErrorCodesEnum.INVALID_CREDENTIALS);
    }

    return this.generateToken(user.id, user.email);
  }

  @HandleExceptions()
  async signUp(dto: CreateUserDto): Promise<TokenResponseDto> {
    const user = await this.userService.create(dto);
    return this.generateToken(user.id, user.email);
  }

  private generateToken(userId: number, email: string): TokenResponseDto {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload, {
      secret: environment.jwtSecret as string,
    });
    return { accessToken };
  }
}
