import { Controller, Get, Post, Patch, Delete, Param, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupportRequestsService } from './support-requests.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { UpdateSupportRequestDto } from './dto/update-support-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('🤍 No estás solo')
@Controller('support-requests')
export class SupportRequestsController {
  constructor(private readonly supportRequestsService: SupportRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar una solicitud de acompañamiento' })
  @ApiResponse({ status: 201, description: 'Solicitud registrada exitosamente' })
  @ApiResponse({ status: 400, description: 'Falta el consentimiento' })
  create(@Body() dto: CreateSupportRequestDto) {
    return this.supportRequestsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar solicitudes de acompañamiento (solo admin)' })
  findAll() {
    return this.supportRequestsService.findAll();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar una solicitud como contactada/no contactada (solo admin)' })
  @ApiParam({ name: 'id', description: 'ID de la solicitud' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  update(@Param('id') id: string, @Body() dto: UpdateSupportRequestDto) {
    return this.supportRequestsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar una solicitud de acompañamiento (solo admin)' })
  @ApiParam({ name: 'id', description: 'ID de la solicitud' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  remove(@Param('id') id: string) {
    return this.supportRequestsService.remove(id);
  }
}
