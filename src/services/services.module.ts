import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { RosterModule } from '../roster/roster.module';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [ConversationsModule, RosterModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
