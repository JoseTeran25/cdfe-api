import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSupportRequestDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  contacted: boolean;
}
