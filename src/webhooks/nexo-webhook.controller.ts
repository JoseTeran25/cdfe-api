import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { ContactSource, MessageDirection, MessageStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';
import { normalizePhone } from '../common/phone.util';
import { mapNexoStatus, parseInboundMessage, parseStatusUpdate, stripWhatsappSuffix } from './nexo-webhook.util';

@ApiExcludeController()
@Controller('webhooks')
export class NexoWebhookController {
  private readonly logger = new Logger(NexoWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly conversations: ConversationsService,
  ) {}

  @Post('nexo')
  @HttpCode(HttpStatus.OK)
  async handle(@Req() req: RawBodyRequest<Request>, @Body() body: any) {
    if (!this.verifySignature(req)) {
      this.logger.warn('Firma de webhook de Nexo inválida o ausente');
      throw new UnauthorizedException('Firma inválida');
    }

    const event = body?.event ?? body?.type;

    switch (event) {
      case 'message_received':
        await this.handleMessageReceived(body);
        break;
      case 'message_status':
      case 'message_sent':
        await this.handleStatusUpdate(body);
        break;
      default:
        this.logger.warn(`Evento de Nexo no manejado: ${event ?? '(sin campo event/type)'}`);
    }

    return { received: true };
  }

  private verifySignature(req: RawBodyRequest<Request>): boolean {
    const secret = this.config.get<string>('NEXO_WEBHOOK_SECRET');
    if (!secret) return true; // aún no configurado en el dashboard de Nexo

    // Nexo firma con la convención estilo GitHub: header X-Hub-Signature-256 = "sha256=<hex>"
    const signature =
      req.headers['x-hub-signature-256'] ??
      req.headers['x-hub-signature'] ??
      req.headers['x-nexo-signature'] ??
      req.headers['x-webhook-signature'] ??
      req.headers['x-signature'];

    if (!signature || !req.rawBody) return false;

    const expected = createHmac('sha256', secret).update(req.rawBody).digest('hex');
    const provided = String(signature).replace(/^sha256=/, '');

    try {
      return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
    } catch {
      return false;
    }
  }

  private async handleMessageReceived(body: any) {
    const parsed = parseInboundMessage(body);
    if (!parsed) {
      this.logger.warn(`No se pudo interpretar el payload de message_received: ${JSON.stringify(body)}`);
      return;
    }

    if (parsed.fromMe) {
      // Mensaje enviado desde el número conectado (ej. respondido manualmente desde el celular),
      // no un mensaje entrante real del contacto — se ignora para no duplicar/confundir el hilo.
      return;
    }

    if (parsed.isGroup) {
      // No soportamos chats grupales, solo conversaciones 1:1 con contactos registrados.
      return;
    }

    if (!parsed.resolved) {
      // `from` es un @lid de privacidad y Nexo no pudo resolver el número real (senderPn ausente).
      // No hay forma de saber a qué contacto pertenece, así que se descarta.
      this.logger.warn(`Mensaje entrante con LID irresoluble, descartado: ${parsed.from}`);
      return;
    }

    const registered = await this.conversations.isRegisteredPhone(parsed.from);
    if (!registered) {
      this.logger.log(`Mensaje entrante descartado (número no registrado): ${parsed.from}`);
      return;
    }

    const phone = normalizePhone(parsed.from);
    let conversation = await this.prisma.conversation.findUnique({ where: { phone } });
    if (!conversation) {
      const contact = await this.resolveContactName(phone);
      conversation = await this.conversations.findOrCreateByPhone(
        parsed.from,
        contact?.name ?? parsed.pushName ?? phone,
        contact?.source ?? ContactSource.SUPPORT_REQUEST,
      );
    }

    const createdAt = parsed.timestamp ?? new Date();

    await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: MessageDirection.INBOUND,
          content: parsed.content,
          status: MessageStatus.DELIVERED,
          externalId: parsed.externalId,
          createdAt,
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: createdAt },
      }),
    ]);
  }

  private async resolveContactName(phone: string): Promise<{ name: string; source: ContactSource } | null> {
    const [supportRequests, users] = await Promise.all([
      this.prisma.supportRequest.findMany({ select: { name: true, contact: true } }),
      this.prisma.user.findMany({ where: { phone: { not: null } }, select: { name: true, phone: true } }),
    ]);

    const sr = supportRequests.find(s => normalizePhone(s.contact) === phone);
    if (sr) return { name: sr.name, source: ContactSource.SUPPORT_REQUEST };

    const u = users.find(x => normalizePhone(x.phone as string) === phone);
    if (u) return { name: u.name, source: ContactSource.TEAM };

    return null;
  }

  private async handleStatusUpdate(body: any) {
    const parsed = parseStatusUpdate(body);
    if (!parsed) {
      this.logger.warn(`No se pudo interpretar el payload de status: ${JSON.stringify(body)}`);
      return;
    }

    const status = mapNexoStatus(parsed.status);
    if (!status) {
      this.logger.warn(`Estado de Nexo no reconocido: ${parsed.status}`);
      return;
    }

    const updated = await this.prisma.message.updateMany({
      where: { externalId: parsed.externalId },
      data: { status },
    });
    if (updated.count > 0) return;

    // Primera vez que vemos este id real de WhatsApp para este mensaje: al enviar no lo
    // conocíamos todavía (ver ConversationsService.sendMessage), así que se correlaciona
    // con el OUTBOUND más reciente sin externalId resuelto en esa conversación.
    if (!parsed.chatJid) {
      this.logger.warn(`Status sin match y sin chatJid para correlacionar: ${parsed.externalId}`);
      return;
    }

    const phone = normalizePhone(stripWhatsappSuffix(parsed.chatJid));
    const conversation = await this.prisma.conversation.findUnique({ where: { phone } });
    if (!conversation) {
      this.logger.warn(`Status para conversación no encontrada (${phone}): ${parsed.externalId}`);
      return;
    }

    const pending = await this.prisma.message.findFirst({
      where: { conversationId: conversation.id, direction: MessageDirection.OUTBOUND, externalId: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!pending) {
      this.logger.warn(`No hay mensaje saliente sin resolver para correlacionar en ${phone}`);
      return;
    }

    await this.prisma.message.update({
      where: { id: pending.id },
      data: { externalId: parsed.externalId, status },
    });
  }
}
