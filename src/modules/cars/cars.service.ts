import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CarsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(make?: string, fuelType?: string, transmission?: string) {
    return this.prisma.car.findMany({
      where: {
        ...(make && { make: { contains: make, mode: 'insensitive' } }),
        ...(fuelType && { fuelType: { equals: fuelType, mode: 'insensitive' } }),
        ...(transmission && { transmission: { equals: transmission, mode: 'insensitive' } }),
      },
    });
  }

  async findOne(id: string) {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: { insuranceEstimates: true },
    });
    if (!car) throw new NotFoundException(`Car ${id} not found`);
    return car;
  }
}
