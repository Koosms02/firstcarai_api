import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  idNumber: true,
  gender: true,
  netSalary: true,
  creditScore: true,
  yearsLicensed: true,
  location: true,
  city: true,
  preferredBrand: true,
  carType: true,
  fuelType: true,
  transmission: true,
  expensesGroceries: true,
  expensesAccounts: true,
  expensesLoans: true,
  expensesOther: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const profileFields = {
      netSalary: dto.netSalary,
      creditScore: dto.creditScore,
      yearsLicensed: dto.yearsLicensed,
      location: dto.location,
      city: dto.city,
      preferredBrand: dto.preferredBrand,
      carType: dto.carType,
      fuelType: dto.fuelType,
      transmission: dto.transmission,
      expensesGroceries: dto.expensesGroceries,
      expensesAccounts: dto.expensesAccounts,
      expensesLoans: dto.expensesLoans,
      expensesOther: dto.expensesOther,
    };
    return this.prisma.user.upsert({
      where: { email: dto.email },
      update: profileFields,
      create: { email: dto.email, password: '', ...profileFields },
      select: USER_SELECT,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: USER_SELECT,
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SELECT,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }
}
