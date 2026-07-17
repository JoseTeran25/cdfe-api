import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContactSource, MessageDirection, MessageStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NexoService } from '../nexo/nexo.service';
import { normalizePhone } from '../common/phone.util';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

export interface MessageableContact {
  contactName: string;
  phone: string;
  contactSource: ContactSource;
  sourceId: string;
  conversationId: string | null;
}

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nexo: NexoService,
  ) {}

  async findAll() {
    return this.prisma.conversation.findMany({
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  async findOne(id: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      throw new NotFoundException(`Conversación con id "${id}" no encontrada`);
    }
    return conversation;
  }

  async findMessages(conversationId: string) {
    await this.findOne(conversationId);
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Contactos registrados (solicitudes + equipo) que se pueden mensajear. */
  async findMessageableContacts(): Promise<MessageableContact[]> {
    const [supportRequests, teamMembers, conversations] = await Promise.all([
      this.prisma.supportRequest.findMany({
        select: { id: true, name: true, contact: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.findMany({
        where: { phone: { not: null } },
        select: { id: true, name: true, phone: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.conversation.findMany({ select: { id: true, phone: true } }),
    ]);

    const conversationByPhone = new Map(conversations.map(c => [c.phone, c.id]));

    const fromSupportRequests: MessageableContact[] = supportRequests.map(sr => {
      const phone = normalizePhone(sr.contact);
      return {
        contactName: sr.name,
        phone,
        contactSource: ContactSource.SUPPORT_REQUEST,
        sourceId: sr.id,
        conversationId: conversationByPhone.get(phone) ?? null,
      };
    });

    const fromTeam: MessageableContact[] = teamMembers.map(u => {
      const phone = normalizePhone(u.phone as string);
      return {
        contactName: u.name,
        phone,
        contactSource: ContactSource.TEAM,
        sourceId: u.id,
        conversationId: conversationByPhone.get(phone) ?? null,
      };
    });

    return [...fromSupportRequests, ...fromTeam];
  }

  /** true si el número pertenece a una solicitud de "No estás solo" o a un miembro del equipo. */
  async isRegisteredPhone(rawPhone: string): Promise<boolean> {
    const phone = normalizePhone(rawPhone);
    if (!phone) return false;

    const [supportRequests, users] = await Promise.all([
      this.prisma.supportRequest.findMany({ select: { contact: true } }),
      this.prisma.user.findMany({ where: { phone: { not: null } }, select: { phone: true } }),
    ]);

    return (
      supportRequests.some(sr => normalizePhone(sr.contact) === phone) ||
      users.some(u => normalizePhone(u.phone as string) === phone)
    );
  }

  async findOrCreateByPhone(phone: string, contactName: string, contactSource: ContactSource) {
    const normalized = normalizePhone(phone);
    const existing = await this.prisma.conversation.findUnique({ where: { phone: normalized } });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: { phone: normalized, contactName, contactSource },
    });
  }

  async create(dto: CreateConversationDto) {
    const registered = await this.isRegisteredPhone(dto.phone);
    if (!registered) {
      throw new BadRequestException(
        'Este número no corresponde a una solicitud de "No estás solo" ni a un miembro del equipo registrado',
      );
    }

    const conversation = await this.findOrCreateByPhone(dto.phone, dto.contactName, dto.contactSource);

    if (dto.initialMessage) {
      await this.sendMessage(conversation.id, { content: dto.initialMessage });
    }

    return this.findOne(conversation.id);
  }

  async sendMessage(conversationId: string, dto: SendMessageDto) {
    const conversation = await this.findOne(conversationId);

    const result = await this.nexo.sendMessage(conversation.phone, dto.content);

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: MessageDirection.OUTBOUND,
          content: dto.content,
          status: MessageStatus.SENT,
          externalId: result.externalId,
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return message;
  }
}
