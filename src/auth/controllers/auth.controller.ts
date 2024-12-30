import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse } from '@nestjs/swagger';

import { LoginDto } from '@/auth/dto/login.dto';
import { TokenResponseDto } from '@/auth/dto/token-response.dto';
import { AuthService } from '@/auth/providers/auth.service';
import { CreateUserDto } from '@/users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @ApiCreatedResponse({ type: TokenResponseDto })
  async signIn(@Body() dto: LoginDto): Promise<TokenResponseDto> {
    const { email, password } = dto;
    return this.authService.signIn(email, password);
  }

  @Post('sign-up')
  @ApiCreatedResponse({ type: TokenResponseDto })
  async signUp(@Body() dto: CreateUserDto): Promise<TokenResponseDto> {
    return this.authService.signUp(dto);
  }
}
