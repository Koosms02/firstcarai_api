import { PrismaService } from '../prisma/prisma.service';
export declare class CarsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(make?: string, fuelType?: string, transmission?: string): Promise<{
        id: string;
        make: string;
        model: string;
        year: number | null;
        price: import("@prisma/client-runtime-utils").Decimal | null;
        mileage: number | null;
        fuelType: string | null;
        transmission: string | null;
        fuelEfficiency: import("@prisma/client-runtime-utils").Decimal | null;
        imageUrl: string | null;
        scrapedSource: string | null;
        createdAt: Date | null;
    }[]>;
    findOne(id: string): Promise<{
        insuranceEstimates: {
            id: string;
            createdAt: Date | null;
            location: string | null;
            carId: string | null;
            riskCategory: string | null;
            estimatedMonthly: import("@prisma/client-runtime-utils").Decimal | null;
        }[];
    } & {
        id: string;
        make: string;
        model: string;
        year: number | null;
        price: import("@prisma/client-runtime-utils").Decimal | null;
        mileage: number | null;
        fuelType: string | null;
        transmission: string | null;
        fuelEfficiency: import("@prisma/client-runtime-utils").Decimal | null;
        imageUrl: string | null;
        scrapedSource: string | null;
        createdAt: Date | null;
    }>;
}
