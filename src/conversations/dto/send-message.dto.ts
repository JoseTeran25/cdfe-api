import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: 'Hola, ¿cómo estás?' })
  @IsString()
  @MinLength(1)
  content: string;
}
