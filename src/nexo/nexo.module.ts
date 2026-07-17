import { Module } from '@nestjs/common';
import { NexoService } from './nexo.service';

@Module({
  providers: [NexoService],
  exports: [NexoService],
})
export class NexoModule {}
