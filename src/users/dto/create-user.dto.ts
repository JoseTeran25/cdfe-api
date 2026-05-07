import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Instrument, Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'juan@cdfe.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: Role, default: Role.MUSICO })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({ enum: Instrument })
  @IsEnum(Instrument)
  @IsOptional()
  instrument?: Instrument;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
