import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('💬 WhatsApp (Nexo)')
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar conversaciones de WhatsApp' })
  findAll() {
    return this.conversationsService.findAll();
  }

  @Get('contacts')
  @ApiOperation({ summary: 'Listar contactos mensajeables (solicitudes + equipo)' })
  findMessageableContacts() {
    return this.conversationsService.findMessageableContacts();
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Historial de mensajes de una conversación' })
  @ApiParam({ name: 'id', description: 'ID de la conversación' })
  findMessages(@Param('id') id: string) {
    return this.conversationsService.findMessages(id);
  }

  @Post()
  @ApiOperation({ summary: 'Iniciar una conversación con un contacto registrado' })
  @ApiResponse({ status: 400, description: 'El número no está registrado (solicitud o equipo)' })
  create(@Body() dto: CreateConversationDto) {
    return this.conversationsService.create(dto);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Enviar un mensaje en una conversación existente' })
  @ApiParam({ name: 'id', description: 'ID de la conversación' })
  sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.conversationsService.sendMessage(id, dto);
  }
}
