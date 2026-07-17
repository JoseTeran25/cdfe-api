import { Module } from '@nestjs/common';
import { NexoWebhookController } from './nexo-webhook.controller';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [ConversationsModule],
  controllers: [NexoWebhookController],
})
export class NexoWebhookModule {}
