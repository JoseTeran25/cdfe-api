import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SupportRequestsService } from './support-requests.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { UpdateSupportRequestDto } from './dto/update-support-request.dto';

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
  @ApiOperation({ summary: 'Listar solicitudes de acompañamiento' })
  findAll() {
    return this.supportRequestsService.findAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Marcar una solicitud como contactada/no contactada' })
  @ApiParam({ name: 'id', description: 'ID de la solicitud' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  update(@Param('id') id: string, @Body() dto: UpdateSupportRequestDto) {
    return this.supportRequestsService.update(id, dto);
  }
}
