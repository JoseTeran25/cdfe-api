import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AddSongToSetlistDto } from './dto/add-song-to-setlist.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ReorderSetlistDto {
  @ApiProperty({ type: [String], example: ['id1', 'id2', 'id3'] })
  @IsArray()
  @IsString({ each: true })
  orderedSongIds: string[];
}

@ApiTags('📅 Servicios')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ─── CRUD Base ────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Crear nuevo servicio' })
  @ApiResponse({ status: 201, description: 'Servicio creado exitosamente' })
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los servicios (más recientes primero)' })
  findAll() {
    return this.servicesService.findAll();
  }

  @Get('next')
  @ApiOperation({ summary: 'Obtener el próximo servicio programado' })
  findNext() {
    return this.servicesService.findNext();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un servicio por ID (con setlist y equipo)' })
  @ApiParam({ name: 'id', description: 'ID del servicio' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de un servicio' })
  @ApiParam({ name: 'id', description: 'ID del servicio' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un servicio' })
  @ApiParam({ name: 'id', description: 'ID del servicio' })
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }

  // ─── Setlist ──────────────────────────────────────────

  @Post(':id/setlist')
  @ApiOperation({ summary: 'Agregar canción al setlist de un servicio' })
  @ApiParam({ name: 'id', description: 'ID del servicio' })
  addSong(
    @Param('id') id: string,
    @Body() dto: AddSongToSetlistDto,
  ) {
    return this.servicesService.addSongToSetlist(id, dto);
  }

  @Delete(':id/setlist/:songId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar canción del setlist' })
  @ApiParam({ name: 'id', description: 'ID del servicio' })
  @ApiParam({ name: 'songId', description: 'ID de la canción' })
  removeSong(
    @Param('id') id: string,
    @Param('songId') songId: string,
  ) {
    return this.servicesService.removeSongFromSetlist(id, songId);
  }

  @Patch(':id/setlist/reorder')
  @ApiOperation({ summary: 'Reordenar el setlist' })
  @ApiParam({ name: 'id', description: 'ID del servicio' })
  reorderSetlist(
    @Param('id') id: string,
    @Body() body: ReorderSetlistDto,
  ) {
    return this.servicesService.reorderSetlist(id, body.orderedSongIds);
  }

  // ─── Team ─────────────────────────────────────────────

  @Post(':id/team')
  @ApiOperation({ summary: 'Asignar músico al equipo del servicio' })
  @ApiParam({ name: 'id', description: 'ID del servicio' })
  addTeamMember(
    @Param('id') id: string,
    @Body() dto: AddTeamMemberDto,
  ) {
    return this.servicesService.addTeamMember(id, dto);
  }

  @Delete(':id/team/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover músico del equipo del servicio' })
  @ApiParam({ name: 'id', description: 'ID del servicio' })
  @ApiParam({ name: 'userId', description: 'ID del músico' })
  removeTeamMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.servicesService.removeTeamMember(id, userId);
  }
}
