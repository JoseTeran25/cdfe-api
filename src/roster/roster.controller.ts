import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RosterService } from './roster.service';
import { UpdateRosterCellDto } from './dto/update-roster-cell.dto';

@ApiTags('🗓️ Programación')
@Controller('roster')
export class RosterController {
  constructor(private readonly rosterService: RosterService) {}

  @Get()
  @ApiOperation({ summary: 'Programación del mes (asignaciones + servicios ya creados)' })
  @ApiQuery({ name: 'month', example: '2026-10' })
  findMonth(@Query('month') month: string) {
    return this.rosterService.findMonth(month);
  }

  @Put('cell')
  @ApiOperation({ summary: 'Reemplazar las personas asignadas a un rol en una fecha' })
  setCell(@Body() dto: UpdateRosterCellDto) {
    return this.rosterService.setCell(dto);
  }

  @Post('apply/:serviceId')
  @ApiOperation({ summary: 'Aplicar la programación al equipo de un servicio ya creado' })
  @ApiParam({ name: 'serviceId', description: 'ID del servicio' })
  apply(@Param('serviceId') serviceId: string) {
    return this.rosterService.applyToService(serviceId);
  }
}
