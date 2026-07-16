import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { SongsModule } from './songs/songs.module';
import { ServicesModule } from './services/services.module';
import { FilesModule } from './files/files.module';
import { SupportRequestsModule } from './support-requests/support-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    SongsModule,
    ServicesModule,
    FilesModule,
    SupportRequestsModule,
  ],
})
export class AppModule {}
