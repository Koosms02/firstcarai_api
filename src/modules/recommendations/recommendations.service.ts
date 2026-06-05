import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string) {
    return this.prisma.recommendation.findMany({
      where: { userId },
      orderBy: { score: 'desc' },
    });
  }

  async setPreferred(recommendationId: string) {
    const rec = await this.prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });
    if (!rec) throw new NotFoundException(`Recommendation ${recommendationId} not found`);

    // Clear previous preferred for this user, then mark the new one
    await this.prisma.recommendation.updateMany({
      where: { userId: rec.userId },
      data: { isPreferred: false },
    });
    return this.prisma.recommendation.update({
      where: { id: recommendationId },
      data: { isPreferred: true },
    });
  }
}
