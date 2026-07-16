import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { UpdateSupportRequestDto } from './dto/update-support-request.dto';

@Injectable()
export class SupportRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSupportRequestDto) {
    if (!dto.consent) {
      throw new BadRequestException(
        'Se requiere el consentimiento para ser contactado/a',
      );
    }

    return this.prisma.supportRequest.create({ data: dto });
  }

  async findAll() {
    return this.prisma.supportRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateSupportRequestDto) {
    const exists = await this.prisma.supportRequest.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Solicitud con id "${id}" no encontrada`);
    }

    return this.prisma.supportRequest.update({ where: { id }, data: dto });
  }
}
