import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  Min,
  Max,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SongStatus, SongCategory } from '@prisma/client';
import { Type } from 'class-transformer';

export class TrackItemDto {
  @ApiProperty({ example: 'Click Track' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://storage.example.com/track.mp3' })
  @IsString()
  url: string;

  @ApiProperty({ enum: ['click', 'guide', 'full', 'stems'] })
  @IsEnum(['click', 'guide', 'full', 'stems'])
  type: 'click' | 'guide' | 'full' | 'stems';
}

export class CreateSongDto {
  @ApiProperty({ example: 'Majestad' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Marcos Barrientos' })
  @IsString()
  artist: string;

  @ApiProperty({ example: 'G', description: 'Tono musical (Am, G, C#, etc.)' })
  @IsString()
  key: string;

  @ApiPropertyOptional({ description: 'Letra en formato ChordPro / Markdown' })
  @IsString()
  @IsOptional()
  lyrics?: string;

  @ApiPropertyOptional({ example: 72, description: 'Beats por minuto' })
  @IsInt()
  @Min(40)
  @Max(240)
  @IsOptional()
  bpm?: number;

  @ApiPropertyOptional({ enum: SongStatus, default: SongStatus.PENDIENTE })
  @IsEnum(SongStatus)
  @IsOptional()
  status?: SongStatus;

  @ApiPropertyOptional({
    enum: SongCategory,
    description: 'Categoria: ALABANZA o ADORACION',
  })
  @IsEnum(SongCategory)
  @IsOptional()
  category?: SongCategory;

  @ApiPropertyOptional({
    type: [TrackItemDto],
    description: 'Tracks de secuencia de audio',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackItemDto)
  @IsOptional()
  sequenceUrl?: TrackItemDto[];

  @ApiPropertyOptional({ type: [String], example: ['adoración', 'lento'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}