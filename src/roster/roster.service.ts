import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Instrument, RosterRole, ServiceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toLocalDateKey } from '../common/date.util';
import { UpdateRosterCellDto } from './dto/update-roster-cell.dto';

const ROLE_TO_INSTRUMENT: Record<RosterRole, Instrument> = {
  BATERIA: Instrument.BATERIA,
  BAJO: Instrument.BAJO,
  GUITARRA_ELECTRICA: Instrument.GUITARRA_ELECTRICA,
  GUITARRA_ACUSTICA_1: Instrument.GUITARRA_ACUSTICA,
  GUITARRA_ACUSTICA_2: Instrument.GUITARRA_ACUSTICA,
  PIANO: Instrument.PIANO,
  VOCES_HOMBRES: Instrument.VOZ_HOMBRE,
  VOCES_MUJERES: Instrument.VOZ_MUJER,
  SONIDO: Instrument.SONIDO,
  LETRAS: Instrument.LETRAS,
  APOYO_MULTIMEDIA: Instrument.APOYO_MULTIMEDIA,
  ORACION: Instrument.ORACION,
};

const USER_SELECT = { id: true, name: true } as const;

@Injectable()
export class RosterService {
  constructor(private readonly prisma: PrismaService) {}

  async findMonth(month: string) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new BadRequestException('El mes debe tener formato YYYY-MM');
    }
    const [year, m] = month.split('-').map(Number);
    const next = m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, '0')}`;

    const assignments = await this.prisma.rosterAssignment.findMany({
      where: { date: { gte: `${month}-01`, lt: `${next}-01` } },
      include: { user: { select: USER_SELECT } },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    // Margen de un día a cada lado para cubrir el desfase UTC ↔ hora local
    const services = await this.prisma.service.findMany({
      where: {
        date: {
          gte: new Date(Date.UTC(year, m - 1, 1) - 86_400_000),
          lt: new Date(Date.UTC(year, m, 1) + 86_400_000),
        },
      },
      select: { id: true, date: true, type: true, title: true },
      orderBy: { date: 'asc' },
    });

    return {
      assignments,
      services: services
        .map((s) => ({ id: s.id, type: s.type, title: s.title, date: toLocalDateKey(s.date) }))
        .filter((s) => s.date.startsWith(month)),
    };
  }

  async setCell(dto: UpdateRosterCellDto) {
    const userIds = [...new Set(dto.userIds)];
    const where = { date: dto.date, serviceType: dto.serviceType, role: dto.role };

    await this.prisma.$transaction([
      this.prisma.rosterAssignment.deleteMany({ where }),
      this.prisma.rosterAssignment.createMany({
        data: userIds.map((userId) => ({ ...where, userId })),
      }),
    ]);

    return this.prisma.rosterAssignment.findMany({
      where,
      include: { user: { select: USER_SELECT } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Copia la programación de la fecha/tipo del servicio a su equipo. Solo agrega, nunca quita. */
  async applyToService(serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, date: true, type: true },
    });
    if (!service) throw new NotFoundException(`Servicio con id "${serviceId}" no encontrado`);

    return this.applyToServiceData(service.id, service.date, service.type);
  }

  async applyToServiceData(serviceId: string, date: Date, type: ServiceType) {
    const assignments = await this.prisma.rosterAssignment.findMany({
      where: { date: toLocalDateKey(date), serviceType: type },
    });
    if (assignments.length === 0) return { added: 0 };

    const { count } = await this.prisma.userService.createMany({
      data: assignments.map((a) => ({
        serviceId,
        userId: a.userId,
        instrument: ROLE_TO_INSTRUMENT[a.role],
      })),
      skipDuplicates: true,
    });
    return { added: count };
  }
}
