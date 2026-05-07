import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Instrument } from '@prisma/client';

export class AddTeamMemberDto {
  @ApiProperty({ example: 'clv01abc123', description: 'ID del músico/vocalista' })
  @IsString()
  userId: string;

  @ApiProperty({ enum: Instrument, example: Instrument.GUITARRA })
  @IsEnum(Instrument)
  instrument: Instrument;
}
