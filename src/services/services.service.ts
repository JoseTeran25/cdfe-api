import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AddSongToSetlistDto } from './dto/add-song-to-setlist.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';

// Include completo reutilizable
const SERVICE_INCLUDE = {
  setlist: {
    include: { song: true },
    orderBy: { order: 'asc' as const },
  },
  team: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          instrument: true,
          avatarUrl: true,
        },
      },
    },
  },
};

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CRUD Base ──────────────────────────────────────────

  async create(dto: CreateServiceDto) {
    const { songIds, ...rest } = dto;

    return this.prisma.service.create({
      data: {
        ...rest,
        date: new Date(dto.date),
        ...(songIds && songIds.length > 0
          ? {
              setlist: {
                create: songIds.map((songId, index) => ({
                  song: { connect: { id: songId } },
                  order: index,
                })),
              },
            }
          : {}),
      },
      include: SERVICE_INCLUDE,
    });
  }

  async findAll() {
    return this.prisma.service.findMany({
      orderBy: { date: 'desc' },
      include: SERVICE_INCLUDE,
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: SERVICE_INCLUDE,
    });
    if (!service) {
      throw new NotFoundException(`Servicio con id "${id}" no encontrado`);
    }
    return service;
  }

  async findNext() {
    return this.prisma.service.findFirst({
      where: { date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      include: SERVICE_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);
    const { songIds, ...rest } = dto;
    return this.prisma.service.update({
      where: { id },
      data: {
        ...rest,
        ...(rest.date ? { date: new Date(rest.date) } : {}),
      },
      include: SERVICE_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.service.delete({ where: { id } });
    return { message: 'Servicio eliminado correctamente' };
  }

  // ─── Setlist ────────────────────────────────────────────

  async addSongToSetlist(serviceId: string, dto: AddSongToSetlistDto) {
    await this.findOne(serviceId);

    // Verificar que la canción existe
    const song = await this.prisma.song.findUnique({
      where: { id: dto.songId },
    });
    if (!song) throw new NotFoundException(`Canción "${dto.songId}" no encontrada`);

    // Verificar si ya está en el setlist
    const already = await this.prisma.serviceSong.findUnique({
      where: {
        serviceId_songId: { serviceId, songId: dto.songId },
      },
    });
    if (already) throw new ConflictException('La canción ya está en el setlist');

    // Calcular orden si no se provee
    let order = dto.order;
    if (order === undefined) {
      const count = await this.prisma.serviceSong.count({
        where: { serviceId },
      });
      order = count;
    }

    await this.prisma.serviceSong.create({
      data: { serviceId, songId: dto.songId, order },
    });

    return this.findOne(serviceId);
  }

  async removeSongFromSetlist(serviceId: string, songId: string) {
    await this.findOne(serviceId);

    const entry = await this.prisma.serviceSong.findUnique({
      where: { serviceId_songId: { serviceId, songId } },
    });
    if (!entry) throw new NotFoundException('La canción no está en el setlist');

    await this.prisma.serviceSong.delete({
      where: { serviceId_songId: { serviceId, songId } },
    });

    return this.findOne(serviceId);
  }

  async reorderSetlist(serviceId: string, orderedSongIds: string[]) {
    await this.findOne(serviceId);

    // Update cada orden en una transacción
    await this.prisma.$transaction(
      orderedSongIds.map((songId, index) =>
        this.prisma.serviceSong.update({
          where: { serviceId_songId: { serviceId, songId } },
          data: { order: index },
        }),
      ),
    );

    return this.findOne(serviceId);
  }

  // ─── Team ───────────────────────────────────────────────

  async addTeamMember(serviceId: string, dto: AddTeamMemberDto) {
    await this.findOne(serviceId);

    // Verificar usuario
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException(`Usuario "${dto.userId}" no encontrado`);

    // Verificar si ya está en el equipo
    const already = await this.prisma.userService.findUnique({
      where: {
        userId_serviceId: { userId: dto.userId, serviceId },
      },
    });
    if (already) throw new ConflictException('El miembro ya está asignado a este servicio');

    await this.prisma.userService.create({
      data: {
        serviceId,
        userId: dto.userId,
        instrument: dto.instrument,
      },
    });

    return this.findOne(serviceId);
  }

  async removeTeamMember(serviceId: string, userId: string) {
    await this.findOne(serviceId);

    const entry = await this.prisma.userService.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
    });
    if (!entry) throw new NotFoundException('El miembro no está asignado a este servicio');

    await this.prisma.userService.delete({
      where: { userId_serviceId: { userId, serviceId } },
    });

    return this.findOne(serviceId);
  }
}
