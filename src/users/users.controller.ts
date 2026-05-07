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
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('👤 Músicos')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo músico/miembro' })
  @ApiResponse({ status: 201, description: 'Músico creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los músicos' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un músico por ID' })
  @ApiParam({ name: 'id', description: 'ID del músico' })
  @ApiResponse({ status: 404, description: 'Músico no encontrado' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de un músico' })
  @ApiParam({ name: 'id', description: 'ID del músico' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un músico' })
  @ApiParam({ name: 'id', description: 'ID del músico' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
