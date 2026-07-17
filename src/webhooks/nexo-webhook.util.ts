import { MessageStatus } from '@prisma/client';

export interface ParsedInboundMessage {
  from: string;
  content: string;
  externalId?: string;
  fromMe: boolean;
  timestamp?: Date;
  pushName?: string;
}

export interface ParsedStatusUpdate {
  externalId: string;
  status: string;
}

/** "593999999999@s.whatsapp.net" → "593999999999" (también cubre @g.us de grupos, que luego se descarta por no estar registrado). */
function stripWhatsappSuffix(jid: string): string {
  return jid.split('@')[0];
}

/** Forma real del evento `message_received` de Nexo. */
export function parseInboundMessage(body: any): ParsedInboundMessage | null {
  const data = body?.data;
  if (!data || typeof data.from !== 'string') return null;

  const content: string =
    typeof data.body === 'string' && data.body.length > 0
      ? data.body
      : data.hasMedia
        ? '[Multimedia]'
        : '';

  return {
    from: stripWhatsappSuffix(data.from),
    content,
    externalId: data.messageId ? String(data.messageId) : undefined,
    fromMe: Boolean(data.fromMe),
    timestamp: typeof data.timestamp === 'number' ? new Date(data.timestamp * 1000) : undefined,
    pushName: typeof data.pushName === 'string' ? data.pushName : undefined,
  };
}

export function parseStatusUpdate(body: any): ParsedStatusUpdate | null {
  const data = body?.data ?? body ?? {};
  const externalId = data.messageId ?? data.id ?? data.externalId;
  const status = data.status ?? data.state;
  if (!externalId || !status) return null;
  return { externalId: String(externalId), status: String(status) };
}

export function mapNexoStatus(status: string): MessageStatus | null {
  const s = status.toLowerCase();
  if (s.includes('read')) return MessageStatus.READ;
  if (s.includes('deliver')) return MessageStatus.DELIVERED;
  if (s.includes('fail') || s.includes('error')) return MessageStatus.FAILED;
  if (s.includes('sent') || s.includes('success')) return MessageStatus.SENT;
  return null;
}
