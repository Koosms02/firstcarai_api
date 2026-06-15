import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDocumentDto) {
    return this.prisma.document.create({
      data: {
        userId: dto.userId,
        documentType: dto.documentType,
        fileName: dto.fileName,
        extractedData: (dto.extractedData ?? undefined) as any,
      },
    });
  }

  async findAll() {
    return this.prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        documentType: true,
        fileName: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        documentType: true,
        fileName: true,
        extractedData: true,
        createdAt: true,
      },
    });
  }
}
