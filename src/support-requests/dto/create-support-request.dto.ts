import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactMethod } from '@prisma/client';

export class CreateSupportRequestDto {
  @ApiProperty({ example: 'María Pérez' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: '+593 99 123 4567' })
  @IsString()
  @MinLength(6)
  contact: string;

  @ApiPropertyOptional({ enum: ContactMethod, default: ContactMethod.WHATSAPP })
  @IsEnum(ContactMethod)
  @IsOptional()
  contactMethod?: ContactMethod;

  @ApiPropertyOptional({ example: 'Estoy pasando por un momento difícil...' })
  @IsString()
  @IsOptional()
  situation?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  consent: boolean;
}
