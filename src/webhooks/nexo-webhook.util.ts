import { MessageStatus } from '@prisma/client';

export interface ParsedInboundMessage {
  from: string;
  content: string;
  externalId?: string;
  fromMe: boolean;
  timestamp?: Date;
  pushName?: string;
  isGroup: boolean;
  resolved: boolean; // false cuando from es un @lid y Nexo no pudo resolver senderPn
}

export interface ParsedStatusUpdate {
  externalId: string;
  status: string;
  chatJid?: string;
}

/**
 * "593999999999@s.whatsapp.net" → "593999999999" (también cubre @g.us de grupos, que luego
 * se descarta por no estar registrado). Además quita el sufijo de dispositivo multi-device
 * de WhatsApp, ej. "80221516603521:61@lid" → "80221516603521".
 */
export function stripWhatsappSuffix(jid: string): string {
  return jid.split('@')[0].split(':')[0];
}

/**
 * Forma real del evento `message_received` de Nexo.
 * `senderPn` es el número real ya resuelto por Nexo — incluso cuando `from` viene como un
 * `@lid` opaco (privacidad del contacto). Si `senderPn` no viene, el LID es irresoluble.
 */
export function parseInboundMessage(body: any): ParsedInboundMessage | null {
  const data = body?.data;
  if (!data || typeof data.from !== 'string') return null;

  const content: string =
    typeof data.body === 'string' && data.body.length > 0
      ? data.body
      : data.hasMedia
        ? '[Multimedia]'
        : '';

  const senderPn = typeof data.senderPn === 'string' && data.senderPn.length > 0 ? data.senderPn : null;

  return {
    from: senderPn ?? stripWhatsappSuffix(data.from),
    content,
    externalId: data.messageId ? String(data.messageId) : undefined,
    fromMe: Boolean(data.fromMe),
    timestamp: typeof data.timestamp === 'number' ? new Date(data.timestamp * 1000) : undefined,
    pushName: typeof data.pushName === 'string' ? data.pushName : undefined,
    isGroup: Boolean(data.participant) || data.from.endsWith('@g.us'),
    resolved: senderPn !== null || !data.from.endsWith('@lid'),
  };
}

/** Forma real del evento `message_status` de Nexo. */
export function parseStatusUpdate(body: any): ParsedStatusUpdate | null {
  const data = body?.data;
  if (!data || typeof data.messageId !== 'string' || typeof data.status !== 'string') return null;
  return {
    externalId: data.messageId,
    status: data.status,
    chatJid: typeof data.chatJid === 'string' ? data.chatJid : undefined,
  };
}

export function mapNexoStatus(status: string): MessageStatus | null {
  const s = status.toUpperCase();
  if (s === 'SENT' || s === 'DELIVERED' || s === 'READ' || s === 'FAILED' || s === 'PENDING') {
    return s as MessageStatus;
  }
  // fallback laxo por si Nexo cambia el naming exacto
  if (s.includes('READ')) return MessageStatus.READ;
  if (s.includes('DELIVER')) return MessageStatus.DELIVERED;
  if (s.includes('FAIL') || s.includes('ERROR')) return MessageStatus.FAILED;
  if (s.includes('SENT') || s.includes('SUCCESS')) return MessageStatus.SENT;
  return null;
}
