import { RecommendationsService } from './recommendations.service';
import { GenerateRecommendationDto } from './dto/generate-recommendation.dto';
export declare class RecommendationsController {
    private readonly recommendationsService;
    constructor(recommendationsService: RecommendationsService);
    generate(dto: GenerateRecommendationDto): Promise<({
        car: {
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
        } | null;
    } & {
        id: string;
        createdAt: Date | null;
        userId: string | null;
        carId: string | null;
        estimatedMonthlyCost: import("@prisma/client-runtime-utils").Decimal | null;
        insuranceCost: import("@prisma/client-runtime-utils").Decimal | null;
        loanCost: import("@prisma/client-runtime-utils").Decimal | null;
        maintenanceCost: import("@prisma/client-runtime-utils").Decimal | null;
        fuelCost: import("@prisma/client-runtime-utils").Decimal | null;
        score: import("@prisma/client-runtime-utils").Decimal | null;
    })[] | {
        id: `${string}-${string}-${string}-${string}-${string}`;
        userId: null;
        carId: string;
        estimatedMonthlyCost: number;
        insuranceCost: number;
        loanCost: number;
        maintenanceCost: number;
        fuelCost: number;
        score: number;
        createdAt: Date;
        car: {
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
        };
    }[]>;
    findByUser(userId: string): Promise<({
        car: {
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
        } | null;
    } & {
        id: string;
        createdAt: Date | null;
        userId: string | null;
        carId: string | null;
        estimatedMonthlyCost: import("@prisma/client-runtime-utils").Decimal | null;
        insuranceCost: import("@prisma/client-runtime-utils").Decimal | null;
        loanCost: import("@prisma/client-runtime-utils").Decimal | null;
        maintenanceCost: import("@prisma/client-runtime-utils").Decimal | null;
        fuelCost: import("@prisma/client-runtime-utils").Decimal | null;
        score: import("@prisma/client-runtime-utils").Decimal | null;
    })[]>;
}
