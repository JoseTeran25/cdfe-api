import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddSongToSetlistDto {
  @ApiProperty({ example: 'clv01abc123', description: 'ID de la canción' })
  @IsString()
  songId: string;

  @ApiPropertyOptional({ example: 1, description: 'Posición en el setlist (1-based)' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  order?: number;
}
