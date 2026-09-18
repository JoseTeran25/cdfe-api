import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@cdfe.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'supersecreto' })
  @IsString()
  @MinLength(6)
  password: string;
}
