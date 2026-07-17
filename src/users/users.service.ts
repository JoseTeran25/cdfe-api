import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Campos seguros a retornar (nunca la contraseña)
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  instrument: true,
  avatarUrl: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    // Verificar email único
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException(`El email "${dto.email}" ya está registrado`);
    }

    if (dto.phone) {
      const phoneTaken = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (phoneTaken) {
        throw new ConflictException(`El teléfono "${dto.phone}" ya está registrado`);
      }
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        ...dto,
        password: hashed,
      },
      select: USER_SELECT,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SELECT,
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
    if (!user) throw new NotFoundException(`Músico con id "${id}" no encontrado`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id); // verifica existencia

    // Si cambia email, verificar unicidad
    if (dto.email) {
      const exists = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (exists) {
        throw new ConflictException(`El email "${dto.email}" ya está en uso`);
      }
    }

    if (dto.phone) {
      const phoneTaken = await this.prisma.user.findFirst({
        where: { phone: dto.phone, NOT: { id } },
      });
      if (phoneTaken) {
        throw new ConflictException(`El teléfono "${dto.phone}" ya está en uso`);
      }
    }

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: `Músico eliminado correctamente` };
  }
}
