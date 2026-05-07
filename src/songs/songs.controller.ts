import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { SongStatus } from '@prisma/client';

@ApiTags('🎵 Canciones')
@Controller('songs')
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva canción' })
  @ApiResponse({ status: 201, description: 'Canción creada exitosamente' })
  create(@Body() dto: CreateSongDto) {
    return this.songsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar canciones (con filtros opcionales)' })
  @ApiQuery({ name: 'status', required: false, enum: SongStatus })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por título, artista o tono' })
  findAll(
    @Query('status') status?: SongStatus,
    @Query('search') search?: string,
  ) {
    return this.songsService.findAll(status, search);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Listar canciones pendientes (por sacar)' })
  findPending() {
    return this.songsService.findPending();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una canción por ID' })
  @ApiParam({ name: 'id', description: 'ID de la canción' })
  @ApiResponse({ status: 404, description: 'Canción no encontrada' })
  findOne(@Param('id') id: string) {
    return this.songsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una canción' })
  @ApiParam({ name: 'id', description: 'ID de la canción' })
  update(@Param('id') id: string, @Body() dto: UpdateSongDto) {
    return this.songsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar una canción' })
  @ApiParam({ name: 'id', description: 'ID de la canción' })
  remove(@Param('id') id: string) {
    return this.songsService.remove(id);
  }
}
