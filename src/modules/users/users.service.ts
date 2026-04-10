import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreatePreferenceDto } from './dto/create-preference.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    return this.prisma.user.upsert({
      where: { email: dto.email },
      update: {
        netSalary: dto.netSalary,
        creditScore: dto.creditScore,
        yearsLicensed: dto.yearsLicensed,
        gender: dto.gender,
        location: dto.location,
      },
      create: dto,
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
