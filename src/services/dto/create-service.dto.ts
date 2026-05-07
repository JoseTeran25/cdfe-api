import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';

export class CreateServiceDto {
  @ApiProperty({ example: '2026-05-11T10:00:00.000Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: ServiceType, example: ServiceType.DOMINGO })
  @IsEnum(ServiceType)
  type: ServiceType;

  @ApiPropertyOptional({ example: 'Servicio Dominical Mañana' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Énfasis en adoración profunda' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['clv01abc', 'clv02def'],
    description: 'IDs de canciones para el setlist inicial',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  songIds?: string[];
}
