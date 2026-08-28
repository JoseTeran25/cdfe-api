import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { SongStatus, ServiceType } from '@prisma/client';

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

  async getTopPlayed(
    year?: number,
    serviceType?: ServiceType,
    limit = 10,
  ) {
    // Filtros sobre el servicio relacionado
    const serviceWhere: Record<string, unknown> = {};
    if (year) {
      serviceWhere.date = {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lte: new Date(`${year}-12-31T23:59:59.999Z`),
      };
    }
    if (serviceType) {
      serviceWhere.type = serviceType;
    }

    // Obtener todos los registros ServiceSong que cumplan el filtro
    const rows = await this.prisma.serviceSong.findMany({
      where: {
        service: Object.keys(serviceWhere).length > 0 ? serviceWhere : undefined,
      },
      include: {
        song: true,
      },
    });

    // Contar en memoria cuántas veces aparece cada canción
    const countMap = new Map<string, { count: number; song: typeof rows[0]['song'] }>();
    for (const row of rows) {
      const entry = countMap.get(row.songId);
      if (entry) {
        entry.count += 1;
      } else {
        countMap.set(row.songId, { count: 1, song: row.song });
      }
    }

    // Ordenar y limitar
    const sorted = Array.from(countMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sorted.map(({ song, count }) => ({ song, count }));
  }
}
