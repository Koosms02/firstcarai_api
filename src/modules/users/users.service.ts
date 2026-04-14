import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreatePreferenceDto } from './dto/create-preference.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const profileFields = {
      netSalary: dto.netSalary,
      creditScore: dto.creditScore,
      yearsLicensed: dto.yearsLicensed,
      gender: dto.gender,
      location: dto.location,
    };
    return this.prisma.user.upsert({
      where: { email: dto.email },
      update: profileFields,
      create: { email: dto.email, password: '', ...profileFields },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        netSalary: true,
        creditScore: true,
        yearsLicensed: true,
        gender: true,
        location: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { preferences: true },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }

  async upsertPreferences(userId: string, dto: CreatePreferenceDto) {
    await this.findOne(userId);
    const existingPreference = await this.prisma.userPreference.findFirst({
      where: { userId },
    });

    if (existingPreference) {
      return this.prisma.userPreference.update({
        where: { id: existingPreference.id },
        data: dto,
      });
    }

    return this.prisma.userPreference.create({
      data: { userId, ...dto },
    });
  }
}
