import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
export declare class DocumentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateDocumentDto): Promise<{
        id: string;
        createdAt: Date | null;
        userId: string;
        documentType: import("@prisma/client").$Enums.DocumentType;
        fileName: string;
        extractedData: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    findByUser(userId: string): Promise<{
        id: string;
        createdAt: Date | null;
        documentType: import("@prisma/client").$Enums.DocumentType;
        fileName: string;
        extractedData: import("@prisma/client/runtime/client").JsonValue;
    }[]>;
}
