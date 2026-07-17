import { MessageStatus } from '@prisma/client';

export interface ParsedInboundMessage {
  from: string;
  content: string;
  externalId?: string;
}

export interface ParsedStatusUpdate {
  externalId: string;
  status: string;
}

/**
 * El payload exacto de Nexo aún no está confirmado (webhook sin configurar todavía),
 * así que probamos varias formas comunes de anidar los campos. Si Nexo usa nombres
 * distintos, ajustar aquí una vez se vea un payload real.
 */
export function parseInboundMessage(body: any): ParsedInboundMessage | null {
  const data = body?.data ?? body?.message ?? body ?? {};
  const from = data.from ?? data.sender ?? data.phone ?? data.number;
  const content = data.content ?? data.text ?? data.body ?? data.message;
  if (!from || typeof content !== 'string') return null;

  const externalId = data.id ?? data.messageId ?? data.externalId;
  return {
    from: String(from),
    content,
    externalId: externalId ? String(externalId) : undefined,
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
