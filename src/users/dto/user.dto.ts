import { ApiProperty, OmitType } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { IsDate, IsEmail, IsNumber, IsString } from 'class-validator';

export class UserWithPasswordDto implements User {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @IsDate()
  updatedAt: Date;

  @ApiProperty()
  @IsDate()
  deletedAt: Date;
}

export class UserDto extends OmitType(UserWithPasswordDto, ['password']) {}
