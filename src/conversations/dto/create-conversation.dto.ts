import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactSource } from '@prisma/client';

export class CreateConversationDto {
  @ApiProperty({ example: '0987654321' })
  @IsString()
  @MinLength(6)
  phone: string;

  @ApiProperty({ example: 'María Pérez' })
  @IsString()
  contactName: string;

  @ApiProperty({ enum: ContactSource, example: ContactSource.SUPPORT_REQUEST })
  @IsEnum(ContactSource)
  contactSource: ContactSource;

  @ApiPropertyOptional({ example: 'Hola María, te escribimos de Comunidad de Fe Sur...' })
  @IsString()
  @IsOptional()
  initialMessage?: string;
}
