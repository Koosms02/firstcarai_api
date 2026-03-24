import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreatePreferenceDto } from './dto/create-preference.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    return this.prisma.user.create({ data: dto });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { preferences: true },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async upsertPreferences(userId: string, dto: CreatePreferenceDto) {
    await this.findOne(userId);
    return this.prisma.userPreference.upsert({
      where: { id: (await this.prisma.userPreference.findFirst({ where: { userId } }))?.id ?? '' },
      update: { ...dto },
      create: { userId, ...dto },
    });
  }
}
