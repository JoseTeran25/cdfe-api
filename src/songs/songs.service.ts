import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { SongStatus } from '@prisma/client';

@Injectable()
export class SongsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSongDto) {
    return this.prisma.song.create({
      data: {
        ...dto,
        sequenceUrl: dto.sequenceUrl as any,
      },
    });
  }

  async findAll(status?: SongStatus, search?: string) {
    return this.prisma.song.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { artist: { contains: search, mode: 'insensitive' } },
                { key: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: string) {
    const song = await this.prisma.song.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: {
              select: { id: true, date: true, type: true, title: true },
            },
          },
          orderBy: { service: { date: 'desc' } },
          take: 10,
        },
      },
    });
    if (!song) throw new NotFoundException(`Canción con id "${id}" no encontrada`);
    return song;
  }

  async update(id: string, dto: UpdateSongDto) {
    await this.findOne(id);
    return this.prisma.song.update({
      where: { id },
      data: {
        ...dto,
        sequenceUrl: dto.sequenceUrl as any,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.song.delete({ where: { id } });
    return { message: 'Canción eliminada correctamente' };
  }

  async findPending() {
    return this.findAll(SongStatus.PENDIENTE);
  }
}
