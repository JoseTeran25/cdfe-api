import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface NexoSendResult {
  externalId?: string;
  raw: unknown;
}

@Injectable()
export class NexoService {
  private readonly logger = new Logger(NexoService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly instanceId: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (this.config.get<string>('NEXO_API_URL') ?? '').replace(/\/$/, '');
    this.apiKey = this.config.get<string>('NEXO_API_KEY') ?? '';
    this.instanceId = this.config.get<string>('NEXO_INSTANCE_ID') ?? '';
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.apiKey && this.instanceId);
  }

  async sendMessage(to: string, content: string): Promise<NexoSendResult> {
    if (!this.isConfigured()) {
      throw new BadGatewayException(
        'Nexo no está configurado. Revisa NEXO_API_URL, NEXO_API_KEY y NEXO_INSTANCE_ID en el .env',
      );
    }

    const res = await fetch(`${this.baseUrl}/messages/send`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanceId: this.instanceId,
        to,
        content,
      }),
    });

    const body: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      this.logger.error(`Nexo send failed (${res.status}): ${JSON.stringify(body)}`);
      throw new BadGatewayException(
        body?.message ?? `No se pudo enviar el mensaje vía Nexo (status ${res.status})`,
      );
    }

    const externalId: string | undefined =
      body?.id ?? body?.messageId ?? body?.data?.id ?? body?.data?.messageId ?? undefined;

    return { externalId, raw: body };
  }
}
