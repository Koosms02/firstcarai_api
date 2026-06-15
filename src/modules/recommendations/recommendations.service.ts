import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPreferred() {
    return this.prisma.preference.findMany({
      where: { isPreferred: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        make: true,
        model: true,
        year: true,
        price: true,
        estimatedMonthlyCost: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.preference.findMany({
      where: { userId },
      orderBy: { score: 'desc' },
    });
  }

  async setPreferred(recommendationId: string) {
    const rec = await this.prisma.preference.findUnique({
      where: { id: recommendationId },
    });
    if (!rec) throw new NotFoundException(`Preference ${recommendationId} not found`);

    // Clear previous preferred for this user, then mark the new one
    await this.prisma.preference.updateMany({
      where: { userId: rec.userId },
      data: { isPreferred: false },
    });
    return this.prisma.preference.update({
      where: { id: recommendationId },
      data: { isPreferred: true },
    });
  }
}
