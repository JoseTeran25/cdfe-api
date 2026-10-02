import { IsArray, IsEnum, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RosterRole, ServiceType } from '@prisma/client';

export class UpdateRosterCellDto {
  @ApiProperty({ example: '2026-10-04', description: 'Fecha local YYYY-MM-DD' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @ApiProperty({ enum: ServiceType, example: ServiceType.DOMINGO })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiProperty({ enum: RosterRole, example: RosterRole.BAJO })
  @IsEnum(RosterRole)
  role: RosterRole;

  @ApiProperty({ type: [String], description: 'IDs de usuarios asignados (reemplaza la celda completa)' })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}
